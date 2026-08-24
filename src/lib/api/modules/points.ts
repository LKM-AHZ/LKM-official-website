import { get, post } from "../../http/client";
import type { PaginatedResponse } from "../types";

export interface PointsBalance {
  user_id: number;
  balance: number;
}
export interface PointsLedgerEntry {
  id: number;
  delta: number;
  balance_after: number;
  reason: string;
  ref_type: string;
  ref_id: string;
  created_at: string;
}
export interface PointsLeaderboardEntry {
  user_id: number;
  display_name: string;
  balance: number;
  title: string;
}
export interface PointsAchievement {
  id: number;
  key: string;
  category: string;
  icon: string;
  name_key: string;
  desc_key: string;
  type: string;
  threshold: number;
  reward_points: number;
  sort_order: number;
  progress: number;
  unlocked: boolean;
}
export interface PointsTask {
  id: number;
  key: string;
  title_key: string;
  desc_key: string;
  category: string;
  requirement_count: number;
  reward_points: number;
  sort_order: number;
  current_progress: number;
  completed: boolean;
}
export interface PointsExchangeItem {
  id: number;
  key: string;
  name_key: string;
  desc_key: string;
  points_cost: number;
  stock: number;
  is_virtual: boolean;
  sort_order: number;
}
export interface PointsCheckin {
  success: boolean;
  earned: number;
  checkin_streak: number;
  today_checked: boolean;
}

export const pointsApi = {
  getBalance: () => get<PointsBalance>("/api/v1/points/me"),
  getLedger: (page = 1, limit = 20) =>
    get<PaginatedResponse<PointsLedgerEntry>>("/api/v1/points/me/ledger", {
      page,
      limit,
    }),
  getLeaderboard: (
    period: "daily" | "weekly" | "total" = "total",
    limit = 50,
  ) =>
    get<PaginatedResponse<PointsLeaderboardEntry>>(
      "/api/v1/points/leaderboard",
      {
        period,
        limit,
      },
    ),
  getAchievements: () =>
    get<PointsAchievement[]>("/api/v1/points/achievements"),
  getTasks: () => get<PointsTask[]>("/api/v1/points/tasks"),
  getExchangeItems: () =>
    get<PointsExchangeItem[]>("/api/v1/points/exchange-items"),
  checkin: () => post<PointsCheckin>("/api/v1/points/checkin"),
};
