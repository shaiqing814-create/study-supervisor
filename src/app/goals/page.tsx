"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import type { WeeklyGoal, Profile } from "@/lib/database.types";

export default function GoalsListPage() {
  return (
    <AppShell>
      <GoalsList />
    </AppShell>
  );
}

function GoalsList() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  const fetchGoals = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      setProfile(profile as Profile);

      const query = supabase.from("weekly_goals").select("*").order("created_at", { ascending: false });

      if (profile.role === "supervisor") {
        query.eq("created_by", user.id);
      } else {
        query.eq("student_id", user.id);
      }

      const { data: goals } = await query;
      if (goals) setGoals(goals as WeeklyGoal[]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const statusLabels: Record<string, string> = { active: "进行中", completed: "已完成", cancelled: "已取消" };
  const statusColors: Record<string, string> = {
    active: "bg-warning/10 text-warning",
    completed: "bg-success/10 text-success",
    cancelled: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">学习目标</h1>
        {profile?.role === "supervisor" && (
          <button
            onClick={() => router.push("/goals/new")}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            + 新建目标
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-24 rounded-xl" />
          <div className="skeleton h-24 rounded-xl" />
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-text-muted">还没有学习目标</p>
          {profile?.role === "supervisor" ? (
            <button
              onClick={() => router.push("/goals/new")}
              className="text-primary text-sm font-medium mt-2 block mx-auto"
            >
              创建第一个目标
            </button>
          ) : (
            <p className="text-text-muted text-xs mt-2">等待监督者创建学习计划</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => router.push(`/goals/detail?id=${goal.id}`)}
              className="w-full p-4 rounded-xl bg-card border border-border text-left card-hover"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">{goal.description}</p>
                  )}
                  <div className="text-xs text-text-muted mt-2">
                    {new Date(goal.week_start).toLocaleDateString("zh-CN", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                    开始的一周
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColors[goal.status]}`}>
                  {statusLabels[goal.status]}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
