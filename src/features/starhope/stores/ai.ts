import { ref, computed, type Ref, type ComputedRef } from "vue";
import { db } from "./db";
import { useAuthStore } from "./auth";
import { enqueue } from "../sync/sync";
import type { AiAgent, AiMessage } from "~/features/starhope/types";
import { t } from "~/lib/i18n";

const agents = ref<AiAgent[]>([]);
const currentAgentId = ref<string | null>(null);
const messages = ref<AiMessage[]>([]);
const isGenerating = ref(false);
const streamContent = ref("");
const error = ref<string | null>(null);

export function useAiStore(): {
  agents: Ref<AiAgent[]>;
  currentAgentId: Ref<string | null>;
  messages: Ref<AiMessage[]>;
  isGenerating: Ref<boolean>;
  streamContent: Ref<string>;
  error: Ref<string | null>;
  currentAgent: ComputedRef<AiAgent | null>;
  loadAgents: () => Promise<void>;
  createAgent: (
    data: Omit<AiAgent, "id" | "userId" | "createdAt">,
  ) => Promise<AiAgent | undefined>;
  updateAgent: (id: string, data: Partial<AiAgent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  selectAgent: (id: string) => void;
  loadMessages: () => Promise<void>;
  sendMessage: (
    content: string,
    attachments?: { name: string; data: string; type: string }[],
  ) => Promise<void>;
  clearConversation: () => Promise<void>;
} {
  const auth = useAuthStore();

  const currentAgent = computed(
    () => agents.value.find((a) => a.id === currentAgentId.value) ?? null,
  );

  async function loadAgents(): Promise<void> {
    try {
      if (!auth.isLoggedIn.value) return;
      agents.value = await db.aiAgents
        .where("userId")
        .equals(auth.userId.value!)
        .toArray();
      if (agents.value.length === 0) {
        await createDefaultAgent();
      }
      if (!currentAgentId.value && agents.value.length > 0) {
        currentAgentId.value = agents.value[0].id;
        await loadMessages();
      }
    } catch (e) {
      error.value = t("starhopeData.ai.loadFail");
      console.error("loadAgents failed:", e);
    }
  }

  async function createDefaultAgent(): Promise<AiAgent> {
    const agent: AiAgent = {
      id: crypto.randomUUID(),
      userId: String(auth.userId.value!),
      name: t("starhopeData.ai.defaultAgentName"),
      systemPrompt: "你是一个有用的学习助手。请用中文回答。",
      service: "openai",
      model: "gpt-4o",
      temperature: 0.7,
      topP: 1,
      maxTokens: 4096,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.aiAgents.put(agent);
    enqueue("agents", agent.id, "upsert", agent);
    agents.value = [...agents.value, agent];
    return agent;
  }

  async function createAgent(
    data: Omit<AiAgent, "id" | "userId" | "createdAt">,
  ): Promise<AiAgent | undefined> {
    try {
      const agent: AiAgent = {
        ...data,
        id: crypto.randomUUID(),
        userId: String(auth.userId.value!),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.aiAgents.put(agent);
      enqueue("agents", agent.id, "upsert", agent);
      await loadAgents();
      return agent;
    } catch {
      error.value = t("starhopeData.ai.createFail");
    }
  }

  async function updateAgent(
    id: string,
    data: Partial<AiAgent>,
  ): Promise<void> {
    try {
      await db.aiAgents.update(id, data);
      await loadAgents();
      // loadAgents 刚把库里最新数据读进 agents.value，这里再 db.get 一次是多余的往返
      const updated = agents.value.find((a) => a.id === id);
      if (updated) enqueue("agents", id, "upsert", updated);
    } catch (e) {
      // 写失败不能变成未处理拒绝：置 error 让 UI 有反馈（与 createAgent 一致）
      error.value = t("messages.operationFailed");
      console.error("updateAgent failed:", e);
    }
  }

  async function deleteAgent(id: string): Promise<void> {
    try {
      await db.aiAgents.delete(id);
      enqueue("agents", id, "delete");
      await db.aiMessages.where("agentId").equals(id).delete();
      await loadAgents();
      if (currentAgentId.value === id) {
        currentAgentId.value = agents.value[0]?.id ?? null;
        await loadMessages();
      }
    } catch (e) {
      error.value = t("messages.operationFailed");
      console.error("deleteAgent failed:", e);
    }
  }

  function selectAgent(id: string): void {
    currentAgentId.value = id;
    loadMessages();
  }

  async function loadMessages(): Promise<void> {
    if (!currentAgentId.value) {
      messages.value = [];
      return;
    }
    try {
      messages.value = await db.aiMessages
        .where("agentId")
        .equals(currentAgentId.value)
        .sortBy("timestamp");
    } catch (e) {
      error.value = t("starhopeData.ai.loadFail");
      console.error("loadMessages failed:", e);
    }
  }

  async function sendMessage(
    content: string,
    attachments?: { name: string; data: string; type: string }[],
  ): Promise<void> {
    // 并发保护：第二次调用会与第一次交错写 messages/streamContent，
    // 且先结束的 finally 会把 isGenerating 提前清掉
    if (isGenerating.value) return;
    // 目标 agent 在 await 前固定：全程用局部量，避免生成期间用户切换
    // selectAgent/发起另一次发送后，回复被写进别的会话
    const agentId = currentAgentId.value;
    if (!agentId || !auth.isLoggedIn.value) return;
    const agent = agents.value.find((a) => a.id === agentId) ?? null;

    const userMsg: AiMessage = {
      id: crypto.randomUUID(),
      agentId,
      role: "user",
      content,
      attachments,
      timestamp: new Date().toISOString(),
    };
    await db.aiMessages.put(userMsg);
    messages.value = [...messages.value, userMsg];
    isGenerating.value = true;
    streamContent.value = "";
    if (!agent) {
      isGenerating.value = false;
      return;
    }
    try {
      const response = await mockAiResponse(agent, content);
      streamContent.value = response;
      const assistantMsg: AiMessage = {
        id: crypto.randomUUID(),
        agentId,
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };
      await db.aiMessages.put(assistantMsg);
      messages.value = [...messages.value, assistantMsg];
      streamContent.value = "";
    } catch (e) {
      const errorMsg: AiMessage = {
        id: crypto.randomUUID(),
        agentId,
        role: "assistant",
        content: t("starhopeData.ai.errorPrefix", {
          message:
            e instanceof Error ? e.message : t("starhopeData.ai.unknownError"),
        }),
        timestamp: new Date().toISOString(),
      };
      await db.aiMessages.put(errorMsg);
      messages.value = [...messages.value, errorMsg];
      streamContent.value = "";
    } finally {
      isGenerating.value = false;
    }
  }

  async function clearConversation(): Promise<void> {
    const agentId = currentAgentId.value;
    if (!agentId) return;
    try {
      // 之前是 fire-and-forget 的 delete：失败只会变成未处理拒绝，且本地消息已清空
      await db.aiMessages.where("agentId").equals(agentId).delete();
      messages.value = [];
    } catch (e) {
      error.value = t("messages.operationFailed");
      console.error("clearConversation failed:", e);
    }
  }

  async function mockAiResponse(
    agent: AiAgent,
    userMessage: string,
  ): Promise<string> {
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
    return t("starhopeData.ai.mockResponse", {
      name: agent.name,
      question: userMessage.slice(0, 30),
    });
  }

  return {
    agents,
    currentAgentId,
    messages,
    isGenerating,
    streamContent,
    error,
    currentAgent,
    loadAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    selectAgent,
    loadMessages,
    sendMessage,
    clearConversation,
  };
}
