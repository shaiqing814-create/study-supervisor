"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import type { WeeklyGoal, DailyTask, Profile, Video, AdjustmentRequest } from "@/lib/database.types";

export default function GoalDetailPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-4 text-text-muted">加载中...</div>}>
        <GoalDetail />
      </Suspense>
    </AppShell>
  );
}

function GoalDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [videos, setVideos] = useState<Record<string, Video>>({});
  const [adjustments, setAdjustments] = useState<AdjustmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const fetchAll = useCallback(async () => {
    if (!id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (profile) setProfile(profile as Profile);

    const { data: goal } = await supabase.from("weekly_goals").select("*").eq("id", id).single();
    if (goal) setGoal(goal as WeeklyGoal);

    const { data: tasks } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("weekly_goal_id", id)
      .order("day", { ascending: true });
    if (tasks) {
      setTasks(tasks as DailyTask[]);
      const videoIds = tasks.filter((t) => t.video_id).map((t) => t.video_id);
      if (videoIds.length > 0) {
        const { data: videoList } = await supabase
          .from("videos")
          .select("*")
          .in("id", videoIds);
        if (videoList) {
          const map: Record<string, Video> = {};
          videoList.forEach((v) => { map[v.id] = v as Video; });
          setVideos(map);
        }
      }
    }

    const { data: adjustments } = await supabase
      .from("adjustment_requests")
      .select("*")
      .eq("goal_id", id)
      .order("created_at", { ascending: false });
    if (adjustments) setAdjustments(adjustments as AdjustmentRequest[]);

    setLoading(false);
  }, [supabase, id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function addTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("daily_tasks").insert({
      weekly_goal_id: id,
      title: form.get("title") as string,
      day: form.get("day") as string,
      status: "pending",
    });

    setShowAddTask(false);
    fetchAll();
  }

  async function toggleTask(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    await supabase.from("daily_tasks").update({ status: newStatus }).eq("id", taskId);
    fetchAll();
  }

  async function saveNote(taskId: string, note: string) {
    await supabase.from("daily_tasks").update({ note }).eq("id", taskId);
    fetchAll();
  }

  async function checkQuiz(taskId: string, videoId: string) {
    const video = videos[videoId];
    if (!video?.quiz_question) return;

    const answer = prompt(video.quiz_question);
    if (answer === null) return;
    const correct = answer.trim().toLowerCase() === video.quiz_answer?.toLowerCase();
    await supabase.from("daily_tasks").update({ quiz_correct: correct }).eq("id", taskId);
    if (!correct) alert("答案不正确，请再想想！");
    fetchAll();
  }

  async function submitAdjustment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("adjustment_requests").insert({
      goal_id: id,
      requested_by: user.id,
      reason: form.get("reason") as string,
      proposed_change: form.get("change") as string,
      status: "pending",
    });

    setShowAdjust(false);
    fetchAll();
  }

  async function handleApproval(adjId: string, status: "approved" | "rejected") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("adjustment_requests").update({
      status,
      responded_by: user.id,
    }).eq("id", adjId);

    fetchAll();
  }

  if (!id) return <div className="p-4 text-text-muted">缺少目标ID</div>;
  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton h-6 w-32 rounded" />
        <div className="skeleton h-40 rounded-xl" />
        <div className="skeleton h-20 rounded-xl" />
      </div>
    );
  }

  if (!goal) return <div className="p-4 text-text-muted">目标不存在</div>;

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const isStudent = profile?.role === "student";
  const isSupervisor = profile?.role === "supervisor";

  const tasksByDay: Record<string, DailyTask[]> = {};
  tasks.forEach((t) => {
    if (!tasksByDay[t.day]) tasksByDay[t.day] = [];
    tasksByDay[t.day].push(t);
  });
  const sortedDays = Object.keys(tasksByDay).sort();

  return (
    <div className="p-4 space-y-5">
      <button onClick={() => router.back()} className="text-text-muted text-sm hover:text-text">
        ← 返回
      </button>

      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-text">{goal.title}</h1>
            {goal.description && <p className="text-sm text-text-muted mt-1">{goal.description}</p>}
            <p className="text-xs text-text-muted mt-2">
              {new Date(goal.week_start).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}
              开始的一周
            </p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            goal.status === "active" ? "bg-warning/10 text-warning" :
            goal.status === "completed" ? "bg-success/10 text-success" :
            "bg-gray-100 text-gray-500"
          }`}>
            {goal.status === "active" ? "进行中" : goal.status === "completed" ? "已完成" : "已取消"}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-text-muted mb-1.5">
            <span>完成进度</span>
            <span>{completedTasks}/{tasks.length} ({progress}%)</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-text">每日任务</h2>
          {isStudent && goal.status === "active" && (
            <button onClick={() => setShowAddTask(true)} className="text-sm text-primary font-medium">
              + 添加任务
            </button>
          )}
        </div>

        {sortedDays.length === 0 ? (
          <div className="text-center py-8 bg-card rounded-xl border border-border">
            <div className="text-3xl mb-2">📝</div>
            <p className="text-text-muted text-sm">
              {isStudent ? "还没有任务，点击上方添加每日任务" : "弟弟还没有拆解任务"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDays.map((day) => (
              <div key={day}>
                <div className="text-xs font-medium text-text-muted mb-2">
                  {new Date(day).toLocaleDateString("zh-CN", { weekday: "long", month: "numeric", day: "numeric" })}
                </div>
                <div className="space-y-2">
                  {tasksByDay[day].map((task) => {
                    const video = task.video_id ? videos[task.video_id] : null;
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        video={video}
                        isStudent={isStudent}
                        onToggle={() => toggleTask(task.id, task.status)}
                        onSaveNote={(note) => saveNote(task.id, note)}
                        onCheckQuiz={() => task.video_id && checkQuiz(task.id, task.video_id)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-text">调整申请</h2>
          {isStudent && goal.status === "active" && (
            <button onClick={() => setShowAdjust(true)} className="text-sm text-primary font-medium">
              + 申请调整
            </button>
          )}
        </div>

        {adjustments.length === 0 ? (
          <p className="text-sm text-text-muted">暂无调整申请</p>
        ) : (
          <div className="space-y-2">
            {adjustments.map((adj) => (
              <div key={adj.id} className="bg-card rounded-xl border border-border p-3">
                <p className="text-sm font-medium">{adj.proposed_change}</p>
                <p className="text-xs text-text-muted mt-1">理由：{adj.reason}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    adj.status === "pending" ? "bg-warning/10 text-warning" :
                    adj.status === "approved" ? "bg-success/10 text-success" :
                    "bg-danger/10 text-danger"
                  }`}>
                    {adj.status === "pending" ? "待审批" : adj.status === "approved" ? "已同意" : "已驳回"}
                  </span>
                  {isSupervisor && adj.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApproval(adj.id, "approved")}
                        className="text-xs px-3 py-1 bg-success text-white rounded-lg font-medium">同意</button>
                      <button onClick={() => handleApproval(adj.id, "rejected")}
                        className="text-xs px-3 py-1 bg-danger text-white rounded-lg font-medium">驳回</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddTask && (
        <Modal onClose={() => setShowAddTask(false)}>
          <form onSubmit={addTask} className="space-y-3">
            <h3 className="font-semibold text-text">添加每日任务</h3>
            <input name="title" required placeholder="任务名称"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input name="day" type="date" required defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button type="submit"
              className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
              添加
            </button>
          </form>
        </Modal>
      )}

      {showAdjust && (
        <Modal onClose={() => setShowAdjust(false)}>
          <form onSubmit={submitAdjustment} className="space-y-3">
            <h3 className="font-semibold text-text">申请调整计划</h3>
            <textarea name="reason" required rows={2} placeholder="调整理由..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            <input name="change" required placeholder="你建议怎么改？"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button type="submit"
              className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
              提交申请
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function TaskCard({
  task, video, isStudent, onToggle, onSaveNote, onCheckQuiz,
}: {
  task: DailyTask; video: Video | null; isStudent: boolean;
  onToggle: () => void; onSaveNote: (note: string) => void; onCheckQuiz: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(task.note || "");

  return (
    <div className={`p-3 rounded-xl border transition-colors ${
      task.status === "completed" ? "bg-success/5 border-success/30" : "bg-card border-border"
    }`}>
      <div className="flex items-start gap-3">
        <button onClick={isStudent ? onToggle : undefined}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            task.status === "completed" ? "bg-success border-success text-white" : "border-gray-300 hover:border-primary"
          }`}>
          {task.status === "completed" && <span className="text-xs">✓</span>}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${task.status === "completed" ? "line-through text-text-muted" : "text-text"}`}>
              {task.title}
            </span>
            {task.quiz_correct !== null && (
              <span className={`text-xs ${task.quiz_correct ? "text-success" : "text-danger"}`}>
                {task.quiz_correct ? "✓ 答题正确" : "✗ 答题错误"}
              </span>
            )}
          </div>

          {video && (
            <a href={video.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-1 inline-block">
              🎬 {video.title}
            </a>
          )}

          {task.note && !editing && (
            <p className="text-xs text-text-muted mt-1 bg-gray-50 p-2 rounded-lg">{task.note}</p>
          )}

          {isStudent && task.status !== "completed" && (
            <div className="flex gap-2 mt-2">
              {video?.quiz_question && (
                <button onClick={onCheckQuiz} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg font-medium">
                  答题验证
                </button>
              )}
              <button onClick={() => setEditing(!editing)}
                className="text-xs px-2 py-1 bg-gray-100 text-text-muted rounded-lg font-medium">
                ✏️ 写笔记
              </button>
            </div>
          )}

          {editing && (
            <div className="mt-2 space-y-2">
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                placeholder="写下学习心得（30字以内）..." maxLength={30}
                className="w-full px-3 py-2 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              <div className="flex gap-2">
                <button onClick={() => { onSaveNote(note); setEditing(false); }}
                  className="text-xs px-3 py-1 bg-primary text-white rounded-lg font-medium">保存</button>
                <button onClick={() => setEditing(false)}
                  className="text-xs px-3 py-1 bg-gray-100 text-text-muted rounded-lg font-medium">取消</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-2xl p-5 w-full max-w-md shadow-xl">
        {children}
      </div>
    </div>
  );
}
