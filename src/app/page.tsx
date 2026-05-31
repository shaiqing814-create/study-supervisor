"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { WeeklyGoal, DailyTask, Profile, AdjustmentRequest } from "@/lib/database.types";
import AppShell from "@/components/AppShell";

export default function HomePage() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) setProfile(profile);

    if (profile?.role === "supervisor") {
      const { data: goals } = await supabase
        .from("weekly_goals")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (goals) setGoals(goals);
    } else {
      const { data: goals } = await supabase
        .from("weekly_goals")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (goals) setGoals(goals);
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-32 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
      </div>
    );
  }

  if (!profile) return null;

  return profile.role === "supervisor" ? (
    <SupervisorDashboard profile={profile} goals={goals} onUpdate={fetchData} />
  ) : (
    <StudentDashboard profile={profile} goals={goals} onUpdate={fetchData} />
  );
}

function SupervisorDashboard({
  profile,
  goals,
  onUpdate,
}: {
  profile: Profile;
  goals: WeeklyGoal[];
  onUpdate: () => void;
}) {
  const router = useRouter();
  const totalGoals = goals.length;
  const activeGoals = goals.filter((g) => g.status === "active").length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;

  return (
    <div className="p-4 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text">你好，{profile.display_name}</h1>
        <p className="text-text-muted text-sm mt-0.5">监督者面板</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="总目标" value={totalGoals} color="bg-primary/10 text-primary" />
        <StatCard label="进行中" value={activeGoals} color="bg-warning/10 text-warning" />
        <StatCard label="已完成" value={completedGoals} color="bg-success/10 text-success" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push("/goals/new")}
          className="p-4 rounded-xl bg-primary text-white text-left hover:bg-primary-dark transition-colors"
        >
          <div className="text-2xl mb-1">📋</div>
          <div className="font-semibold text-sm">制定周目标</div>
          <div className="text-xs opacity-80 mt-0.5">给弟弟安排新计划</div>
        </button>
        <button
          onClick={() => router.push("/videos")}
          className="p-4 rounded-xl bg-card border border-border text-left card-hover"
        >
          <div className="text-2xl mb-1">🎬</div>
          <div className="font-semibold text-sm">导入视频</div>
          <div className="text-xs text-text-muted mt-0.5">添加B站学习资源</div>
        </button>
        <button
          onClick={() => router.push("/subjects")}
          className="p-4 rounded-xl bg-card border border-border text-left card-hover"
        >
          <div className="text-2xl mb-1">📖</div>
          <div className="font-semibold text-sm">知识图谱</div>
          <div className="text-xs text-text-muted mt-0.5">管理课本结构</div>
        </button>
        <button
          onClick={() => router.push("/reports")}
          className="p-4 rounded-xl bg-card border border-border text-left card-hover"
        >
          <div className="text-2xl mb-1">📊</div>
          <div className="font-semibold text-sm">学习周报</div>
          <div className="text-xs text-text-muted mt-0.5">查看学习成果</div>
        </button>
      </div>

      {/* Recent goals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-text">最近目标</h2>
          <button onClick={() => router.push("/goals")} className="text-sm text-primary font-medium">
            查看全部
          </button>
        </div>
        {goals.length === 0 ? (
          <div className="text-center py-8 bg-card rounded-xl border border-border">
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-text-muted text-sm">还没有创建目标</p>
            <button
              onClick={() => router.push("/goals/new")}
              className="text-primary text-sm font-medium mt-1"
            >
              创建第一个周目标
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onClick={() => router.push(`/goals/detail?id=${goal.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StudentDashboard({
  profile,
  goals,
  onUpdate,
}: {
  profile: Profile;
  goals: WeeklyGoal[];
  onUpdate: () => void;
}) {
  const router = useRouter();
  const activeGoal = goals.find((g) => g.status === "active");
  const completedCount = goals.filter((g) => g.status === "completed").length;

  return (
    <div className="p-4 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text">你好，{profile.display_name}</h1>
        <p className="text-text-muted text-sm mt-0.5">{profile.grade || ""} · 学生面板</p>
      </div>

      {/* Current week progress */}
      {activeGoal ? (
        <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl p-5">
          <div className="text-sm opacity-80">本周目标</div>
          <div className="text-lg font-bold mt-1">{activeGoal.title}</div>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => router.push(`/goals/detail?id=${activeGoal.id}`)}
              className="px-4 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
            >
              开始学习
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <div className="text-3xl mb-2">📭</div>
          <p className="text-text-muted text-sm">暂无进行中的目标</p>
          <p className="text-text-muted text-xs mt-1">等待哥哥/姐姐给你安排新计划</p>
        </div>
      )}

      {/* Quick access */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push("/subjects")}
          className="p-4 rounded-xl bg-card border border-border text-left card-hover"
        >
          <div className="text-2xl mb-1">📖</div>
          <div className="font-semibold text-sm">课本学习</div>
          <div className="text-xs text-text-muted mt-0.5">按知识点选择性学习</div>
        </button>
        <button
          onClick={() => router.push("/roadmap")}
          className="p-4 rounded-xl bg-card border border-border text-left card-hover"
        >
          <div className="text-2xl mb-1">🗺️</div>
          <div className="font-semibold text-sm">备考路线</div>
          <div className="text-xs text-text-muted mt-0.5">闯关式复习路线</div>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="已完成" value={completedCount} color="bg-success/10 text-success" />
        <StatCard label="进行中" value={goals.filter((g) => g.status === "active").length} color="bg-warning/10 text-warning" />
        <StatCard label="总计划" value={goals.length} color="bg-primary/10 text-primary" />
      </div>

      {/* Recent goals */}
      {goals.length > 0 && (
        <div>
          <h2 className="font-semibold text-text mb-3">历史目标</h2>
          <div className="space-y-2">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onClick={() => router.push(`/goals/detail?id=${goal.id}`)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-3 ${color} bg-opacity-10`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-0.5 opacity-70">{label}</div>
    </div>
  );
}

function GoalCard({ goal, onClick }: { goal: WeeklyGoal; onClick: () => void }) {
  const statusColors: Record<string, string> = {
    active: "bg-warning/10 text-warning border-warning/30",
    completed: "bg-success/10 text-success border-success/30",
    cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  };
  const statusLabels: Record<string, string> = {
    active: "进行中",
    completed: "已完成",
    cancelled: "已取消",
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-3.5 rounded-xl bg-card border border-border text-left card-hover"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm truncate flex-1">{goal.title}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full border ml-2 shrink-0 ${statusColors[goal.status]}`}
        >
          {statusLabels[goal.status]}
        </span>
      </div>
      <div className="text-xs text-text-muted mt-1">
        {new Date(goal.week_start).toLocaleDateString("zh-CN", {
          month: "long",
          day: "numeric",
        })}
        开始的一周
      </div>
    </button>
  );
}
