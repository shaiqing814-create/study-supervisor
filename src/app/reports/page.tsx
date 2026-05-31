"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import type { WeeklyGoal, DailyTask, Profile } from "@/lib/database.types";

interface WeekReport {
  goal: WeeklyGoal;
  tasks: DailyTask[];
  totalTasks: number;
  completedTasks: number;
  progress: number;
  weekLabel: string;
}

export default function ReportsPage() {
  return (
    <AppShell>
      <Reports />
    </AppShell>
  );
}

function Reports() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<WeekReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<WeekReport | null>(null);
  const supabase = createClient();

  const fetchReports = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (profile) setProfile(profile as Profile);

    const query = supabase.from("weekly_goals").select("*").order("week_start", { ascending: false });

    if (profile?.role === "supervisor") {
      query.eq("created_by", user.id);
    } else {
      query.eq("student_id", user.id);
    }

    const { data: goals } = await query;
    if (!goals) { setLoading(false); return; }

    const reportList: WeekReport[] = [];
    for (const goal of goals) {
      const { data: tasks } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("weekly_goal_id", goal.id);

      const taskList = (tasks || []) as DailyTask[];
      const completed = taskList.filter((t) => t.status === "completed").length;

      const weekStart = new Date(goal.week_start);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      reportList.push({
        goal: goal as WeeklyGoal,
        tasks: taskList,
        totalTasks: taskList.length,
        completedTasks: completed,
        progress: taskList.length > 0 ? Math.round((completed / taskList.length) * 100) : 0,
        weekLabel: `${weekStart.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })} - ${weekEnd.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}`,
      });
    }

    setReports(reportList);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Calculate overall stats
  const totalWeeks = reports.length;
  const totalTasks = reports.reduce((s, r) => s + r.totalTasks, 0);
  const totalCompleted = reports.reduce((s, r) => s + r.completedTasks, 0);
  const overallProgress = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const weeks100 = reports.filter((r) => r.progress === 100).length;

  const allNotes = reports.flatMap((r) =>
    r.tasks.filter((t) => t.note).map((t) => ({ note: t.note!, day: t.day, title: t.title }))
  );

  if (selectedReport) {
    return (
      <div className="p-4 space-y-4">
        <button onClick={() => setSelectedReport(null)} className="text-text-muted text-sm hover:text-text">
          ← 返回周报列表
        </button>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h1 className="text-lg font-bold text-text">{selectedReport.goal.title}</h1>
          <p className="text-sm text-text-muted mt-1">{selectedReport.weekLabel}</p>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span>完成率</span>
              <span className="font-bold">{selectedReport.completedTasks}/{selectedReport.totalTasks} ({selectedReport.progress}%)</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all"
                style={{ width: `${selectedReport.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Task detail */}
        <div className="space-y-2">
          <h2 className="font-semibold text-text">任务明细</h2>
          {selectedReport.tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-xl border ${
                task.status === "completed" ? "bg-success/5 border-success/30" : "bg-card border-border"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{task.status === "completed" ? "✅" : "⬜"}</span>
                <span className={`text-sm ${task.status === "completed" ? "line-through text-text-muted" : "text-text"}`}>
                  {task.title}
                </span>
              </div>
              <div className="text-xs text-text-muted mt-1 ml-7">{task.day}</div>
              {task.note && (
                <p className="text-xs text-text-muted mt-1 ml-7 bg-gray-50 p-2 rounded-lg">
                  📝 {task.note}
                </p>
              )}
              {task.quiz_correct !== null && (
                <div className="text-xs mt-1 ml-7">
                  {task.quiz_correct ? (
                    <span className="text-success">✓ 答题正确</span>
                  ) : (
                    <span className="text-danger">✗ 答题错误</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Notes summary */}
        {allNotes.length > 0 && (
          <div>
            <h2 className="font-semibold text-text mb-2">📝 学习笔记</h2>
            <div className="space-y-1">
              {allNotes.map((n, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-2 text-xs text-text-muted">
                  <span className="font-medium">{n.title}</span>: {n.note}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      <h1 className="text-xl font-bold text-text">📊 学习周报</h1>

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-32 rounded-xl" />
          <div className="skeleton h-24 rounded-xl" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-text-muted">还没有学习记录</p>
        </div>
      ) : (
        <>
          {/* Overall summary */}
          <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl p-5">
            <h2 className="font-semibold">总体概览</h2>
            <div className="grid grid-cols-4 gap-3 mt-3">
              <div>
                <div className="text-2xl font-bold">{totalWeeks}</div>
                <div className="text-xs opacity-80">总周数</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{totalCompleted}</div>
                <div className="text-xs opacity-80">完成任务</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{overallProgress}%</div>
                <div className="text-xs opacity-80">总完成率</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{weeks100}</div>
                <div className="text-xs opacity-80">完美周</div>
              </div>
            </div>
          </div>

          {/* Weekly list */}
          <div className="space-y-3">
            {reports.map((report, i) => (
              <button
                key={report.goal.id}
                onClick={() => setSelectedReport(report)}
                className="w-full p-4 rounded-xl bg-card border border-border text-left card-hover"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{report.goal.title}</h3>
                    <p className="text-xs text-text-muted mt-0.5">{report.weekLabel}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{report.progress}%</div>
                    <div className="text-xs text-text-muted">{report.completedTasks}/{report.totalTasks} 任务</div>
                  </div>
                </div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      report.progress === 100 ? "bg-success" :
                      report.progress >= 50 ? "bg-warning" : "bg-gray-300"
                    }`}
                    style={{ width: `${report.progress}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
