import { ref, computed, type Ref, type ComputedRef } from "vue";
import { db } from "./db";
import { useAuthStore } from "./auth";
import { enqueue } from "../sync/sync";
import type { Question, Folder } from "~/features/starhope/types";

const questions = ref<Question[]>([]);
const folders = ref<Folder[]>([]);
const currentFolderId = ref<string | null>(null);
const selectedIds = ref<Set<string>>(new Set());
const sortKey = ref<"createdAt" | "difficulty" | "type">("createdAt");
const searchQuery = ref("");
const error = ref<string | null>(null);

export function useQuestionBankStore(): {
  questions: Ref<Question[]>;
  folders: Ref<Folder[]>;
  currentFolderId: Ref<string | null>;
  selectedIds: Ref<Set<string>>;
  sortKey: Ref<"createdAt" | "difficulty" | "type">;
  searchQuery: Ref<string>;
  error: Ref<string | null>;
  filteredQuestions: ComputedRef<Question[]>;
  loadQuestions: () => Promise<void>;
  loadFolders: () => Promise<void>;
  createQuestion: (
    data: Omit<Question, "id" | "userId" | "createdAt" | "updatedAt">,
  ) => Promise<Question>;
  updateQuestion: (id: string, data: Partial<Question>) => Promise<void>;
  deleteQuestions: (ids: string[]) => Promise<void>;
  createFolder: (name: string, parentId?: string | null) => Promise<Folder>;
  deleteFolder: (id: string) => Promise<void>;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
} {
  const auth = useAuthStore();

  const filteredQuestions = computed(() => {
    let list = questions.value;
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      list = list.filter(
        (item) =>
          item.content.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  });

  async function loadQuestions(): Promise<void> {
    if (!auth.isLoggedIn.value) return;
    let query = db.questions.where("userId").equals(auth.userId.value!);
    if (currentFolderId.value)
      query = query.and((q: Question) => q.folderId === currentFolderId.value);
    questions.value = await query.toArray();
    applySort();
  }

  async function loadFolders(): Promise<void> {
    if (!auth.isLoggedIn.value) return;
    folders.value = await db.folders
      .where("userId")
      .equals(auth.userId.value!)
      .toArray();
  }

  async function createQuestion(
    data: Omit<Question, "id" | "userId" | "createdAt" | "updatedAt">,
  ): Promise<Question> {
    const q: Question = {
      ...data,
      id: crypto.randomUUID(),
      userId: String(auth.userId.value!),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.questions.put(q);
    enqueue("questions", q.id, "upsert", q);
    await loadQuestions();
    return q;
  }

  async function updateQuestion(
    id: string,
    data: Partial<Question>,
  ): Promise<void> {
    // data 是 Partial<Question>，允许带 id/userId/createdAt：直接展开会写入身份与归属字段
    // （改主键 Dexie 直接抛错，改 userId 会破坏归属与同步合并）
    const patch: Partial<Question> = { ...data };
    delete patch.id;
    delete patch.userId;
    delete patch.createdAt;
    await db.questions.update(id, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    await loadQuestions();
    const updated = await db.questions.get(id);
    if (updated) enqueue("questions", id, "upsert", updated);
  }

  async function deleteQuestions(ids: string[]): Promise<void> {
    await db.questions.bulkDelete(ids);
    ids.forEach((id) => enqueue("questions", id, "delete"));
    selectedIds.value = new Set();
    await loadQuestions();
  }

  async function createFolder(
    name: string,
    parentId: string | null = null,
  ): Promise<Folder> {
    const folder: Folder = {
      id: crypto.randomUUID(),
      userId: String(auth.userId.value!),
      name,
      parentId,
      sort: folders.value.length,
      updatedAt: new Date().toISOString(),
    };
    await db.folders.put(folder);
    enqueue("folders", folder.id, "upsert", folder);
    await loadFolders();
    return folder;
  }

  async function deleteFolder(id: string): Promise<void> {
    const now = new Date().toISOString();
    // 级联变更也要同步：先查出受影响子项，本地 reparent/清 folderId 后逐条入队，
    // 否则其他设备 pull 到 folder 的 tombstone 后仍残留 dangling folder_id/parent_id。
    const childFolders = await db.folders
      .where("parentId")
      .equals(id)
      .toArray();
    const affectedQuestions = await db.questions
      .where("folderId")
      .equals(id)
      .toArray();

    await db.folders
      .where("parentId")
      .equals(id)
      .modify({ parentId: null, updatedAt: now });
    await db.questions
      .where("folderId")
      .equals(id)
      .modify({ folderId: undefined, updatedAt: now });
    await db.folders.delete(id);
    enqueue("folders", id, "delete");
    for (const child of childFolders) {
      enqueue("folders", child.id, "upsert", {
        ...child,
        parentId: null,
        updatedAt: now,
      });
    }
    for (const q of affectedQuestions) {
      enqueue("questions", q.id, "upsert", {
        ...q,
        folderId: undefined,
        updatedAt: now,
      });
    }
    await loadFolders();
    await loadQuestions();
  }

  function toggleSelect(id: string): void {
    const next = new Set(selectedIds.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectedIds.value = next;
  }

  function selectAll(): void {
    selectedIds.value = new Set(filteredQuestions.value.map((q) => q.id));
  }
  function clearSelection(): void {
    selectedIds.value = new Set();
  }

  function applySort(): void {
    switch (sortKey.value) {
      case "createdAt":
        questions.value.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case "difficulty":
        questions.value.sort((a, b) => b.difficulty - a.difficulty);
        break;
      case "type":
        questions.value.sort((a, b) => a.type.localeCompare(b.type));
        break;
    }
  }

  return {
    questions,
    folders,
    currentFolderId,
    selectedIds,
    sortKey,
    searchQuery,
    error,
    filteredQuestions,
    loadQuestions,
    loadFolders,
    createQuestion,
    updateQuestion,
    deleteQuestions,
    createFolder,
    deleteFolder,
    toggleSelect,
    selectAll,
    clearSelection,
  };
}
