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

// 上面这些 ref 是模块级单例，跨组件、跨账号共享：记下当前缓存属于哪个账号，
// 账号一变（登出再换号登录）就先清空，否则上一个账号的会话内容会留在界面上
let loadedUserId: string | null = null;

function resetState(): void {
  agents.value = [];
  messages.value = [];
  currentAgentId.value = null;
  streamContent.value = "";
  error.value = null;
}

/** 默认智能体的出厂配置：这些值会发给模型侧（不是界面文案，故不经 t()），
 *  集中一处便于调整，不必在函数体里翻找 */
const DEFAULT_AGENT_CONFIG: Pick<
  AiAgent,
  "systemPrompt" | "service" | "model" | "temperature" | "topP" | "maxTokens"
> = {
  systemPrompt: "你是一个有用的学习助手。请用中文回答。",
  service: "openai",
  model: "gpt-4o",
  temperature: 0.7,
  topP: 1,
  maxTokens: 4096,
};

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
      const uid = auth.userId.value;
      if (!auth.isLoggedIn.value || !uid) {
        // 登出后（island 仍挂载）必须清掉缓存，否则界面还留着上一个会话的智能体与消息
        resetState();
        loadedUserId = null;
        return;
      }
      if (loadedUserId !== uid) {
        // 换号登录：messages 不会被下面的分支覆盖（currentAgentId 非空就不重选智能体），
        // 不清就会把上一个账号的对话留在界面上
        resetState();
        loadedUserId = uid;
      }
      agents.value = await db.aiAgents.where("userId").equals(uid).toArray();
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
      ...DEFAULT_AGENT_CONFIG,
      id: crypto.randomUUID(),
      userId: String(auth.userId.value!),
      name: t("starhopeData.ai.defaultAgentName"),
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
    // 未登录时 userId 是 null，String(null) 会写出 userId:"null" 的孤儿智能体，
    // 还会一并入同步队列（loadAgents/sendMessage 都有这道门，这里补齐）
    const uid = auth.userId.value;
    if (!auth.isLoggedIn.value || !uid) return;
    try {
      const agent: AiAgent = {
        ...data,
        id: crypto.randomUUID(),
        userId: uid,
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
