// blog（Series/Git 文件）只读 GraphQL 查询文档
//
// 与后端 LKM-service app/modules/blog/graphql.py 的 BlogQuery 对应。
// 字段名严格对齐后端 camelCase schema（strawberry），映射到 snake_case
// 公共类型（BlogSeriesDetail / GitFileContent）的工作在 blog.ts 的 map 函数内完成。
//
// 只接入前端真实被消费的两个读方法（getSeriesDetail / getFileContent，见
// git-persistence.ts）；其余 blog 读方法前端无消费方，按 YAGNI 在 blog.ts 返回
// err()，不在此处定义文档。

import { graphql } from "../graphql";

export const BLOG_SERIES_DETAIL = graphql`
  query BlogSeriesDetail($id: ID!) {
    blogSeriesDetail(seriesId: $id) {
      id
      ownerId
      title
      description
      coverUrl
      repoName
      status
      starCount
      isStarred
      # fileTree 是嵌套结构，GraphQL 选择集必须写死层数：这里固定 6 层（fileTree + 5 层 children），
      # 更深的目录会返回“type=tree 但没有 children”的空目录节点（静默截断，原来只选 3 层）。
      # blog.ts 的 mapFileTree 会按 children 递归，往后加深只需在此追加一层 children。
      fileTree {
        name
        type
        children {
          name
          type
          children {
            name
            type
            children {
              name
              type
              children {
                name
                type
                children {
                  name
                  type
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const BLOG_FILE_CONTENT = graphql`
  query BlogFileContent($seriesId: ID!, $filepath: String!) {
    blogFileContent(seriesId: $seriesId, filepath: $filepath) {
      filepath
      content
    }
  }
`;
