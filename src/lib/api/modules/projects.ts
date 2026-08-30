// 项目广场 API 客户端 —— 对接后端 /api/v1/projects/*
//
// 后端 ProjectOut 为 snake_case 字段，这里映射为前端 UI 使用的 camelCase 形状。

import { get, post } from "../../http/client";

/** 项目广场展示形状（camelCase）。 */
export interface ProjectItem {
  id: number;
  title: string;
  summary: string;
  description: string;
  applicantName: string;
  isIncubated: boolean;
  type: "recruiting" | "showcase";
  isRecruiting: boolean;
  isPinned: boolean;
  progress: number;
  background: string | null;
  goals: string | null;
  requirements: string | null;
  teamIntro: string | null;
  recruitingRoles: string[];
  tags: string[];
  reports: { title: string; content: string; revision: number; date: string }[];
  members: { id: number; displayName: string; roleInProject: string }[];
  createdAt: string;
}

export interface ProjectMemberClaim {
  displayName: string;
  roleInProject: string;
  userId?: number | null;
}

export interface ProjectApplicationInput {
  title: string;
  summary: string;
  description: string;
  memberClaims?: ProjectMemberClaim[];
}

/** 后端 ProjectOut 的 snake_case 形状。 */
interface BackendProject {
  id: number;
  title: string;
  summary: string;
  description: string;
  applicant_id: number;
  applicant_name: string;
  is_incubated: boolean;
  type: "recruiting" | "showcase";
  is_recruiting: boolean;
  is_pinned: boolean;
  progress: number;
  background: string | null;
  goals: string | null;
  requirements: string | null;
  team_intro: string | null;
  recruiting_roles: string[];
  tags: string[];
  reports: { title: string; content: string; revision: number; date: string }[];
  members: {
    id: number;
    display_name: string;
    role_in_project: string;
    sort_order: number;
  }[];
  status: string;
  created_at: string;
}

function mapProject(b: BackendProject): ProjectItem {
  return {
    id: b.id,
    title: b.title,
    summary: b.summary,
    description: b.description,
    applicantName: b.applicant_name,
    isIncubated: b.is_incubated,
    type: b.type,
    isRecruiting: b.is_recruiting,
    isPinned: b.is_pinned,
    progress: b.progress,
    background: b.background,
    goals: b.goals,
    requirements: b.requirements,
    teamIntro: b.team_intro,
    recruitingRoles: b.recruiting_roles ?? [],
    tags: b.tags ?? [],
    reports: b.reports ?? [],
    members: (b.members ?? []).map((m) => ({
      id: m.id,
      displayName: m.display_name,
      roleInProject: m.role_in_project,
    })),
    createdAt: b.created_at,
  };
}

export const projectApi = {
  /** 项目广场列表。 */
  async listProjects(): Promise<ProjectItem[]> {
    const res = await get<BackendProject[]>("/api/v1/projects");
    if (res.isErr()) return [];
    return (res.value ?? []).map(mapProject);
  },

  /** 项目详情。 */
  async getProject(id: number): Promise<ProjectItem | null> {
    const res = await get<BackendProject>(`/api/v1/projects/${id}`);
    if (res.isErr()) return null;
    return mapProject(res.value);
  },

  /** 提交孵化申请。 */
  async submitApplication(input: ProjectApplicationInput): Promise<boolean> {
    const res = await post(`/api/v1/projects/applications`, {
      title: input.title,
      summary: input.summary,
      description: input.description,
      member_claims: (input.memberClaims ?? []).map((m) => ({
        display_name: m.displayName,
        role_in_project: m.roleInProject,
        user_id: m.userId ?? null,
      })),
    });
    return !res.isErr();
  },
};
