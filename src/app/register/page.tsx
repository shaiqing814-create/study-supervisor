"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { UserRole } from "@/lib/database.types";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [grade, setGrade] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const grades = ["高一", "高二", "高三"];

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError("密码至少6位");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          display_name: displayName,
          grade: role === "student" ? grade : null,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/login?registered=true");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📚</div>
          <h1 className="text-2xl font-bold text-text">创建账号</h1>
          <p className="text-text-muted mt-1 text-sm">注册督学助手</p>
        </div>

        <form onSubmit={handleRegister} className="bg-card rounded-2xl shadow-sm border border-border p-6 space-y-4">
          {error && (
            <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">我是</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("supervisor")}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  role === "supervisor"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-text-muted border-border hover:border-primary/50"
                }`}
              >
                🧑‍💼 监督者
              </button>
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  role === "student"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-text-muted border-border hover:border-primary/50"
                }`}
              >
                🎒 学生
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">昵称</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="怎么称呼你"
            />
          </div>

          {role === "student" && (
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">年级</label>
              <div className="grid grid-cols-3 gap-2">
                {grades.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                      grade === g
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-text-muted border-border hover:border-primary/50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">邮箱</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">密码</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="至少6位"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? "注册中..." : "注册"}
          </button>

          <p className="text-center text-sm text-text-muted">
            已有账号？{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              登录
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
