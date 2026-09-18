// src/lib/api/modules/follow.ts — 关注关系（用户 & 版块）
// 契约 = 后端 /api/v1，snake_case → camelCase。
// 依赖 src/lib/http/client 的 get/post/del（自动解包 {code,msg,data}）返回 Result<T>。

import { get, post, del } from "../../http/client";

export interface FollowToggle {
  following: boolean;
}

export interface FollowStatus {
  is_following: boolean;
}

export interface FollowUser {
  user_id: string;
  display_name: string;
  avatar: string | null;
}

export interface FollowBoard {
  board_id: string;
  title: string;
}

export interface FollowListData<T> {
  items: T[];
}

export const followApi = {
  followUser: (userId: string) =>
    post<FollowToggle>(`/api/v1/users/${userId}/follow`),
  unfollowUser: (userId: string) =>
    del<FollowToggle>(`/api/v1/users/${userId}/follow`),
  followBoard: (boardId: string) =>
    post<FollowToggle>(`/api/v1/content/boards/${boardId}/follow`),
  unfollowBoard: (boardId: string) =>
    del<FollowToggle>(`/api/v1/content/boards/${boardId}/follow`),
  myFollowingUsers: () =>
    get<FollowListData<FollowUser>>("/api/v1/users/me/following"),
  myFollowingBoards: () =>
    get<FollowListData<FollowBoard>>("/api/v1/content/boards/me/following"),
  followStatus: (userId: string) =>
    get<FollowStatus>(`/api/v1/users/${userId}/follow/status`),
};
