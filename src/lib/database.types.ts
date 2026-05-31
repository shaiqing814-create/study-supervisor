export type UserRole = "supervisor" | "student";

export type KnowledgeTag = "common" | "required" | "difficult";

export type TaskStatus = "pending" | "in_progress" | "completed";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  display_name: string;
  grade?: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  grade: string;
  display_order: number;
}

export interface Chapter {
  id: string;
  subject_id: string;
  title: string;
  display_order: number;
}

export interface KnowledgePoint {
  id: string;
  chapter_id: string;
  title: string;
  tag: KnowledgeTag;
  description?: string;
  display_order: number;
}

export interface Video {
  id: string;
  knowledge_point_id: string;
  url: string;
  title: string;
  bilibili_bv?: string;
  quiz_question?: string;
  quiz_answer?: string;
  created_by: string;
  created_at: string;
}

export interface WeeklyGoal {
  id: string;
  title: string;
  description?: string;
  created_by: string;
  student_id: string;
  week_start: string;
  status: "active" | "completed" | "cancelled";
  created_at: string;
}

export interface DailyTask {
  id: string;
  weekly_goal_id: string;
  title: string;
  description?: string;
  video_id?: string;
  day: string;
  status: TaskStatus;
  note?: string;
  quiz_correct?: boolean;
  created_at: string;
}

export interface AdjustmentRequest {
  id: string;
  task_id?: string;
  goal_id?: string;
  requested_by: string;
  reason: string;
  proposed_change: string;
  status: ApprovalStatus;
  responded_by?: string;
  created_at: string;
}
