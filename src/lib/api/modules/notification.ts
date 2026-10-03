import { get, post } from "../../http/client";
import type { PaginatedResponse } from "../types";

export interface SiteNotification {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export const notificationApi = {
  list: () =>
    get<PaginatedResponse<SiteNotification>>("/api/v1/notification/me", {
      page: 1,
      limit: 50,
    }),
  unreadCount: () =>
    get<{ unread: number }>("/api/v1/notification/me/unread-count"),
  markRead: (ids: string[], all = false) =>
    post<{ updated: number }>("/api/v1/notification/me/read", { ids, all }),
};
