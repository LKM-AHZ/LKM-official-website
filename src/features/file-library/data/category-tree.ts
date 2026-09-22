// 文件库三级学科分类树（纯前端静态数据）。parentId 为 null 表示一级（根）。
// 用户可见字段（name）已替换为 i18n key，渲染时需用 t(field) 显示。

export interface FileCategory {
  id: string;
  name: string;
  parentId: string | null;
}

export const fileCategories: FileCategory[] = [
  // ─── 一级 ───
  {
    id: "basic-science",
    name: "fileLibraryData.categories.basicScience",
    parentId: null,
  },
  {
    id: "applied-science",
    name: "fileLibraryData.categories.appliedScience",
    parentId: null,
  },
  {
    id: "language",
    name: "fileLibraryData.categories.language",
    parentId: null,
  },

  // ─── 二级（基础学科下）───
  {
    id: "math",
    name: "fileLibraryData.categories.math",
    parentId: "basic-science",
  },
  {
    id: "physics",
    name: "fileLibraryData.categories.physics",
    parentId: "basic-science",
  },
  {
    id: "chemistry",
    name: "fileLibraryData.categories.chemistry",
    parentId: "basic-science",
  },
  {
    id: "biology",
    name: "fileLibraryData.categories.biology",
    parentId: "basic-science",
  },
  {
    id: "earth-science",
    name: "fileLibraryData.categories.earthScience",
    parentId: "basic-science",
  },
  {
    id: "cosmos-astronomy",
    name: "fileLibraryData.categories.cosmosAstronomy",
    parentId: "basic-science",
  },

  // ─── 二级（应用学科下）───
  {
    id: "cs",
    name: "fileLibraryData.categories.cs",
    parentId: "applied-science",
  },
  {
    id: "ic-semiconductor",
    name: "fileLibraryData.categories.icSemiconductor",
    parentId: "applied-science",
  },

  // ─── 二级（语言学习下）───
  {
    id: "lang-en",
    name: "fileLibraryData.categories.langEn",
    parentId: "language",
  },

  // ─── 三级（叶子，挂文件）───
  // 注意：叶子判定看的是「有没有子节点」，不取决于层级——上面 lang-en 等二级节点
  // 同样没有子节点、也是可挂文件的叶子，别用层级序号推断
  {
    id: "math-linear-algebra",
    name: "fileLibraryData.categories.mathLinearAlgebra",
    parentId: "math",
  },
  {
    id: "math-modeling",
    name: "fileLibraryData.categories.mathModeling",
    parentId: "math",
  },
  {
    id: "physics-quantum",
    name: "fileLibraryData.categories.physicsQuantum",
    parentId: "physics",
  },
  {
    id: "physics-astrophysics",
    name: "fileLibraryData.categories.physicsAstrophysics",
    parentId: "physics",
  },
  {
    id: "chemistry-organic",
    name: "fileLibraryData.categories.chemistryOrganic",
    parentId: "chemistry",
  },
  {
    id: "cs-python",
    name: "fileLibraryData.categories.csPython",
    parentId: "cs",
  },
  {
    id: "ic-design",
    name: "fileLibraryData.categories.icDesign",
    parentId: "ic-semiconductor",
  },
  {
    id: "lang-en-writing",
    name: "fileLibraryData.categories.langEnWriting",
    parentId: "lang-en",
  },
];

/** 按 id 查分类；不存在返回 undefined。 */
export function getCategory(id: string): FileCategory | undefined {
  return fileCategories.find((c) => c.id === id);
}

/** 取某层的子分类；根传 null。 */
export function getChildren(parentId: string | null): FileCategory[] {
  return fileCategories.filter((c) => c.parentId === parentId);
}

/** 从 id 回溯到根的路径数组（根→当前节点）；id 不存在返回 []。 */
export function getCategoryPath(id: string): FileCategory[] {
  const path: FileCategory[] = [];
  let current: FileCategory | undefined = getCategory(id);
  const seen = new Set<string>();
  while (current) {
    if (seen.has(current.id)) return []; // 数据成环：回退到根
    seen.add(current.id);
    path.unshift(current);
    if (current.parentId === null) return path; // 正常闭合到根节点
    current = getCategory(current.parentId);
  }
  // 父链断裂（parentId 指向不存在的分类）也返回空：返回已累积的截断路径会让调用方
  // 把「数学」当成根渲染出一段半截面包屑
  return [];
}

/** 是否叶子：分类存在且无子分类。不存在的 id 返回 false，避免拼错的分类被当成可挂文件的叶子。 */
export function isLeaf(id: string): boolean {
  return getCategory(id) !== undefined && getChildren(id).length === 0;
}

/** 递归统计该分类下（含子孙）的匹配文件总数。files 只需 categoryId 字段。 */
export function countFilesInCategory(
  id: string,
  files: { categoryId: string }[],
  visited: Set<string> = new Set(),
): number {
  // 树数据没有运行时校验，parentId 互指（成环）会让递归永不终止并爆栈：
  // 与 getCategoryPath 一样用访问集合兜底，两个遍历助手行为保持一致
  if (visited.has(id)) return 0;
  visited.add(id);
  const direct = files.filter((f) => f.categoryId === id).length;
  const children = getChildren(id);
  if (children.length === 0) return direct;
  return (
    direct +
    children.reduce(
      (sum, c) => sum + countFilesInCategory(c.id, files, visited),
      0,
    )
  );
}
