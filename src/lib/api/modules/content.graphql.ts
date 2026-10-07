// 统一内容数据层（content/boards）的只读 GraphQL 查询文档
//
// 与后端 LKM-service app/modules/content/graphql.py 的 ContentQuery 对应。
// 字段名严格对齐后端 camelCase schema（strawberry），映射到 snake_case
// 公共类型的工作在 content.ts 的 map 函数内完成。
// 写方法（create/delete/like/createComment）保留 REST，不在此处定义文档。

import { graphql } from "../graphql";

export const BOARDS = graphql`
  query Boards {
    boards {
      id
      slug
      title
      description
      parentId
      ownerId
      status
      requireCertified
      dailyPostLimit
      isPublic
    }
  }
`;

// ContentItem 的公共字段集：三处查询共用一份，后端改字段名只需改这一行
// （urql 的 gql 支持在模板里插值普通字符串）
const CONTENT_ITEM_FIELDS =
  "id contentType boardId authorId authorName publisher department columnId columnTitle qaQuestionId slug title excerpt summary cover keywords content tags status isPinned isFeatured viewCount likeCount commentCount bookmarkCount forwardCount readingTime createdAt publishedAt";

export const CONTENT_ITEMS = graphql`
  query ContentItems(
    $page: Int!
    $pageSize: Int!
    $boardId: ID
    $contentType: String
    $authorId: ID
  ) {
    contentItems(
      page: $page
      pageSize: $pageSize
      boardId: $boardId
      contentType: $contentType
      authorId: $authorId
    ) {
      items {
      ${CONTENT_ITEM_FIELDS}
      }
      total
      page
      pages
    }
  }
`;

export const CONTENT_ITEM = graphql`
  query ContentItem($id: ID!) {
    contentItem(id: $id) {
      ${CONTENT_ITEM_FIELDS}
    }
  }
`;

export const CONTENT_ITEM_BY_SLUG = graphql`
  query ContentItemBySlug($slug: String!) {
    contentItemBySlug(slug: $slug) {
      ${CONTENT_ITEM_FIELDS}
    }
  }
`;

export const CONTENT_COMMENTS = graphql`
  query ContentComments($itemId: ID!, $page: Int!, $pageSize: Int!) {
    contentComments(itemId: $itemId, page: $page, pageSize: $pageSize) {
      items {
        id
        contentId
        authorId
        authorName
        content
        floorNumber
        parentId
        likeCount
        liked
        createdAt
      }
      total
      page
      pages
    }
  }
`;

// 详情页互动按钮的初值。刻意不复用 CONTENT_ITEM：那份查询带正文，详情页已在 SSR 拉过
// 一遍，客户端为了补初值再拉整篇等于把正文重复传一遍。
// 后端实现是 interaction 域（收藏归属那边），字段名 camelCase 对齐 GraphContentViewerState。
export const CONTENT_VIEWER_STATE = graphql`
  query ContentViewerState($contentId: ID!) {
    contentViewerState(contentId: $contentId) {
      liked
      favorited
      likeCount
      bookmarkCount
    }
  }
`;
