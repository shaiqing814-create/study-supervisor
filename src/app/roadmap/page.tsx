"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import type { Subject, Chapter, KnowledgePoint, Profile } from "@/lib/database.types";

export default function RoadmapPage() {
  return (
    <AppShell>
      <Roadmap />
    </AppShell>
  );
}

function Roadmap() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [roadmap, setRoadmap] = useState<{ chapter: Chapter; points: KnowledgePoint[] }[]>([]);
  const [learnedPoints, setLearnedPoints] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profile) setProfile(profile as Profile);

      if (profile?.role === "student") {
        const { data: learned } = await supabase
          .from("learned_points")
          .select("*")
          .eq("user_id", user.id);
        if (learned) {
          const map: Record<string, string> = {};
          learned.forEach((l: any) => { map[l.knowledge_point_id] = l.status; });
          setLearnedPoints(map);
        }
      }

      const { data: subjects } = await supabase
        .from("subjects")
        .select("*")
        .order("display_order");

      if (subjects) {
        setSubjects(subjects as Subject[]);
        // Default to first subject
        if (subjects.length > 0) {
          await loadRoadmap(subjects[0] as Subject);
          setSelectedSubject(subjects[0] as Subject);
        }
      }

      setLoading(false);
    }
    load();
  }, [supabase]);

  async function loadRoadmap(subject: Subject) {
    setSelectedSubject(subject);
    const { data: chapters } = await supabase
      .from("chapters")
      .select("*")
      .eq("subject_id", subject.id)
      .order("display_order");

    if (!chapters) return;

    const roadmapData: { chapter: Chapter; points: KnowledgePoint[] }[] = [];
    for (const ch of chapters) {
      const { data: points } = await supabase
        .from("knowledge_points")
        .select("*")
        .eq("chapter_id", ch.id)
        .order("display_order");
      if (points && points.length > 0) {
        roadmapData.push({ chapter: ch as Chapter, points: points as KnowledgePoint[] });
      }
    }

    setRoadmap(roadmapData);

    // Find current position
    let found = false;
    let idx = 0;
    for (const { points } of roadmapData) {
      for (const kp of points) {
        if (!learnedPoints[kp.id] || learnedPoints[kp.id] === "not_started" || learnedPoints[kp.id] === "learning") {
          found = true;
          break;
        }
        idx++;
      }
      if (found) break;
    }
    setCurrentIndex(found ? idx : 0);
  }

  const totalPoints = roadmap.reduce((sum, { points }) => sum + points.length, 0);
  const completedPoints = roadmap.reduce(
    (sum, { points }) =>
      sum + points.filter((kp) => learnedPoints[kp.id] === "mastered").length,
    0
  );
  const totalProgress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  const tagLabels: Record<string, { label: string; className: string }> = {
    common: { label: "常考", className: "tag-common" },
    required: { label: "必考", className: "tag-required" },
    difficult: { label: "难点", className: "tag-difficult" },
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-text">🗺️ 备考路线图</h1>

      {/* Subject selector */}
      <div className="flex gap-2 flex-wrap">
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => loadRoadmap(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedSubject?.id === s.id
                ? "bg-primary text-white"
                : "bg-card border border-border text-text-muted"
            }`}
          >
            {getSubjectIcon(s.name)} {s.name}
          </button>
        ))}
      </div>

      {/* Overall progress */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text">总进度</span>
          <span className="text-sm text-text-muted">{completedPoints}/{totalPoints} 个知识点已掌握</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-success rounded-full progress-fill transition-all duration-700"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-32 rounded-xl" />
          <div className="skeleton h-32 rounded-xl" />
        </div>
      ) : roadmap.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-text-muted">暂无路线图数据</p>
          <p className="text-text-muted text-sm mt-1">请先搭建知识图谱</p>
        </div>
      ) : (
        <div className="space-y-6">
          {roadmap.map(({ chapter, points }, chIdx) => (
            <div key={chapter.id}>
              <h3 className="font-semibold text-text mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                  {chIdx + 1}
                </span>
                {chapter.title}
              </h3>

              <div className="ml-3 pl-4 border-l-2 border-gray-200 space-y-3">
                {points.map((kp, kpIdx) => {
                  const status = learnedPoints[kp.id] || "not_started";
                  const isCompleted = status === "mastered";
                  const isCurrent =
                    !isCompleted &&
                    points.slice(0, kpIdx).every((p) => learnedPoints[p.id] === "mastered") &&
                    chIdx <= roadmap.findIndex((r) =>
                      r.points.some((p) => !learnedPoints[p.id] || learnedPoints[p.id] !== "mastered")
                    );

                  return (
                    <div
                      key={kp.id}
                      className={`roadmap-node p-3 rounded-xl border transition-colors ${
                        isCompleted
                          ? "bg-success/5 border-success/30"
                          : isCurrent
                          ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                          : "bg-card border-border"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isCompleted
                              ? "bg-success border-success"
                              : "border-gray-300"
                          }`}
                        >
                          {isCompleted && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className={`text-sm font-medium ${isCompleted ? "text-text-muted" : "text-text"}`}>
                          {kp.title}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${tagLabels[kp.tag]?.className}`}>
                          {tagLabels[kp.tag]?.label}
                        </span>
                        {isCurrent && (
                          <span className="text-xs text-primary font-medium animate-pulse">← 当前</span>
                        )}
                      </div>
                      {kp.description && (
                        <p className="text-xs text-text-muted mt-1 ml-6">{kp.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getSubjectIcon(name: string): string {
  const icons: Record<string, string> = {
    "语文": "📝", "数学": "🔢", "英语": "🌍",
    "物理": "⚡", "化学": "🧪", "生物": "🧬",
    "政治": "⚖️", "历史": "📜", "地理": "🌏",
  };
  return icons[name] || "📚";
}
