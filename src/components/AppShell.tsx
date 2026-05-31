"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import type { Profile } from "@/lib/database.types";

const navItems = [
  { href: "/", label: "首页", icon: "🏠" },
  { href: "/goals", label: "目标", icon: "🎯" },
  { href: "/subjects", label: "课本", icon: "📖" },
  { href: "/videos", label: "视频", icon: "🎬" },
  { href: "/roadmap", label: "路线", icon: "🗺️" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data as Profile);
      }
      setAuthChecked(true);
    }
    checkAuth();
  }, [supabase, pathname]);

  useEffect(() => {
    if (authChecked && !profile && !pathname.startsWith("/login") && !pathname.startsWith("/register")) {
      router.push("/login");
    }
  }, [authChecked, profile, pathname, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setProfile(null);
    router.push("/login");
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/80 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-4xl mx-auto w-full">
          <span className="font-bold text-primary text-lg">📚 督学助手</span>
          <div className="flex items-center gap-2">
            {profile && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-sm text-text-muted hover:text-text transition-colors"
              >
                {profile.role === "supervisor" ? "🧑‍💼" : "🎒"} {profile.display_name}
              </button>
            )}
          </div>
        </div>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-2 top-14 z-20 bg-card border border-border rounded-xl shadow-lg p-2 w-48">
              {profile && (
                <div className="px-3 py-2 text-xs text-text-muted border-b border-border mb-1">
                  {profile.email}
                  <br />
                  {profile.role === "supervisor" ? "监督者" : `学生 · ${profile.grade || ""}`}
                </div>
              )}
              <button
                onClick={() => { handleLogout(); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/5 rounded-lg transition-colors"
              >
                退出登录
              </button>
            </div>
          </>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto w-full pb-20 lg:pb-8">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-card/80 backdrop-blur border-t border-border lg:hidden">
        <div className="flex items-center justify-around h-16 px-2 max-w-4xl mx-auto">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                pathname === item.href
                  ? "text-primary"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
