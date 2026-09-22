// The old SSG blog content collection has been removed (Task 8 of blog unification).
// These functions now return empty data. The blog sidebar widgets (Tags.astro, Categories.astro)
// display this data. If content is needed in the future, fetch from the blog API instead.
//
// 原 getSortedPosts / getSortedPostsList 返回 Promise<never[]> 且全仓库无调用方，
// 属随内容集合一起消失的脚手架，已删除（保留下方仍在被 Tags/Categories 使用的两个）。

export type Tag = {
  name: string;
  count: number;
};

export async function getTagList(): Promise<Tag[]> {
  return [];
}

export type Category = {
  name: string;
  count: number;
  url: string;
};

export async function getCategoryList(): Promise<Category[]> {
  return [];
}
