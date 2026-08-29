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

export const CONTENT_ITEMS = graphql`
  query ContentItems(
    $page: Int!
    $pageSize: Int!
    $boardId: Int
    $contentType: String
  ) {
    contentItems(
      page: $page
      pageSize: $pageSize
      boardId: $boardId
      contentType: $contentType
    ) {
      items {
        id
        contentType
        boardId
        authorId
        authorName
        publisher
        department
        columnId
        columnTitle
        qaQuestionId
        slug
        title
        excerpt
        summary
        cover
        keywords
        content
        tags
        status
        isPinned
        isFeatured
        viewCount
        likeCount
        commentCount
        bookmarkCount
        forwardCount
        readingTime
        createdAt
        publishedAt
      }
      total
      page
      pages
    }
  }
`;

export const CONTENT_ITEM = graphql`
  query ContentItem($id: Int!) {
    contentItem(id: $id) {
      id
      contentType
      boardId
      authorId
      authorName
      publisher
      department
      columnId
      columnTitle
      qaQuestionId
      slug
      title
      excerpt
      summary
      cover
      keywords
      content
      tags
      status
      isPinned
      isFeatured
      viewCount
      likeCount
      commentCount
      bookmarkCount
      forwardCount
      readingTime
      createdAt
      publishedAt
    }
  }
`;

export const CONTENT_ITEM_BY_SLUG = graphql`
  query ContentItemBySlug($slug: String!) {
    contentItemBySlug(slug: $slug) {
      id
      contentType
      boardId
      authorId
      authorName
      publisher
      department
      columnId
      columnTitle
      qaQuestionId
      slug
      title
      excerpt
      summary
      cover
      keywords
      content
      tags
      status
      isPinned
      isFeatured
      viewCount
      likeCount
      commentCount
      bookmarkCount
      forwardCount
      readingTime
      createdAt
      publishedAt
    }
  }
`;

export const CONTENT_COMMENTS = graphql`
  query ContentComments($itemId: Int!, $page: Int!, $pageSize: Int!) {
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
        createdAt
      }
      total
      page
      pages
    }
  }
`;
