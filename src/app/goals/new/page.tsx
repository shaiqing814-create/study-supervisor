"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import type { Profile } from "@/lib/database.types";

export default function NewGoalPage() {
  return (
    <AppShell>
      <NewGoal />
    </AppShell>
  );
}

function NewGoal() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weekStart, setWeekStart] = useState(getNextMonday());
  const [studentEmail, setStudentEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  function getNextMonday() {
    const d = new Date();
    d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
    return d.toISOString().split("T")[0];
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Find student by email
    const { data: students, error: studentError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", studentEmail)
      .eq("role", "student");

    if (studentError || !students || students.length === 0) {
      setError("未找到该学生，请确认邮箱正确");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("weekly_goals")
      .insert({
        title,
        description: description || null,
        created_by: user.id,
        student_id: students[0].id,
        week_start: weekStart,
        status: "active",
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      router.push("/goals");
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <button onClick={() => router.back()} className="text-text-muted text-sm mb-4 hover:text-text">
        ← 返回
      </button>
      <h1 className="text-xl font-bold text-text mb-4">制定周目标</h1>

      <form onSubmit={handleCreate} className="space-y-4">
        {error && (
          <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">目标标题</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="如：本周攻克函数专题"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">详细说明（选填）</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            placeholder="具体要完成哪些内容..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">开始日期</label>
          <input
            type="date"
            required
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">学生邮箱</label>
          <input
            type="email"
            required
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="弟弟注册时使用的邮箱"
          />
          <p className="text-xs text-text-muted mt-1">输入弟弟注册时的邮箱来关联他的账号</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? "创建中..." : "创建目标"}
        </button>
      </form>
    </div>
  );
}
