"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import type { Subject, Chapter, KnowledgePoint, Video, Profile } from "@/lib/database.types";

type Grade = "高一" | "高二" | "高三";

export default function SubjectsPage() {
  return (
    <AppShell>
      <KnowledgeGraph />
    </AppShell>
  );
}

function KnowledgeGraph() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<Grade>("高一");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [videos, setVideos] = useState<Record<string, Video[]>>({});
  const [learnedPoints, setLearnedPoints] = useState<Record<string, string>>({});
  const [filterTag, setFilterTag] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profile) {
        setProfile(profile as Profile);
        if (profile.grade) setSelectedGrade(profile.grade as Grade);
      }

      const { data: subjects } = await supabase
        .from("subjects")
        .select("*")
        .eq("grade", profile?.grade || "高一")
        .order("display_order");
      if (subjects) setSubjects(subjects as Subject[]);

      // Load learned points
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

      setLoading(false);
    }
    load();
  }, [supabase]);

  async function selectSubject(subject: Subject) {
    setSelectedSubject(subject);
    setSelectedChapter(null);
    setKnowledgePoints([]);

    const { data: chapters } = await supabase
      .from("chapters")
      .select("*")
      .eq("subject_id", subject.id)
      .order("display_order");
    if (chapters) setChapters(chapters as Chapter[]);
  }

  async function selectChapter(chapter: Chapter) {
    setSelectedChapter(chapter);

    const { data: points } = await supabase
      .from("knowledge_points")
      .select("*")
      .eq("chapter_id", chapter.id)
      .order("display_order");
    if (!points) return;

    const filtered = filterTag === "all" ? points : points.filter((p) => p.tag === filterTag);
    setKnowledgePoints(filtered as KnowledgePoint[]);

    // Fetch videos for these knowledge points
    if (points.length > 0) {
      const { data: videoList } = await supabase
        .from("videos")
        .select("*")
        .in("knowledge_point_id", points.map((p) => p.id));

      if (videoList) {
        const videoMap: Record<string, Video[]> = {};
        videoList.forEach((v) => {
          const kpId = v.knowledge_point_id;
          if (!videoMap[kpId]) videoMap[kpId] = [];
          videoMap[kpId].push(v as Video);
        });
        setVideos(videoMap);
      }
    }
  }

  async function updateLearnedStatus(kpId: string, status: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("learned_points")
      .upsert({ user_id: user.id, knowledge_point_id: kpId, status, updated_at: new Date().toISOString() });

    setLearnedPoints((prev) => ({ ...prev, [kpId]: status }));
  }

  const tagLabels: Record<string, { label: string; className: string }> = {
    common: { label: "常考", className: "tag-common" },
    required: { label: "必考", className: "tag-required" },
    difficult: { label: "难点", className: "tag-difficult" },
  };

  const learnedLabels: Record<string, string> = {
    not_started: "未学",
    learning: "学习中",
    mastered: "已掌握",
    weak: "薄弱",
  };

  const learnedColors: Record<string, string> = {
    not_started: "bg-gray-100 text-gray-500",
    learning: "bg-blue-100 text-blue-700",
    mastered: "bg-green-100 text-green-700",
    weak: "bg-red-100 text-red-700",
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-text">📖 知识图谱</h1>

      {/* Grade selector */}
      <div className="flex gap-2">
        {(["高一", "高二", "高三"] as Grade[]).map((g) => (
          <button
            key={g}
            onClick={() => { setSelectedGrade(g); setSelectedSubject(null); setSelectedChapter(null); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedGrade === g ? "bg-primary text-white" : "bg-card border border-border text-text-muted"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-12 rounded-xl" />
          <div className="skeleton h-12 rounded-xl" />
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          icon="📭"
          title="暂无课本数据"
          description="知识图谱尚未搭建，请联系监督者或使用AI生成"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => selectSubject(s)}
              className={`p-4 rounded-xl text-left transition-all ${
                selectedSubject?.id === s.id
                  ? "bg-primary text-white"
                  : "bg-card border border-border card-hover"
              }`}
            >
              <div className="text-2xl mb-1">{getSubjectIcon(s.name)}</div>
              <div className="font-semibold text-sm">{s.name}</div>
            </button>
          ))}
        </div>
      )}

      {/* Chapters */}
      {selectedSubject && (
        <div>
          <h2 className="font-semibold text-text mb-3">{selectedSubject.name} · 章节</h2>
          <div className="space-y-2">
            {chapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => selectChapter(ch)}
                className={`w-full p-3 rounded-xl text-left text-sm transition-colors ${
                  selectedChapter?.id === ch.id
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-card border border-border card-hover"
                }`}
              >
                {ch.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Knowledge points with filter */}
      {selectedChapter && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-text">{selectedChapter.title} · 知识点</h2>
            <div className="flex gap-1">
              {["all", "required", "common", "difficult"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setFilterTag(tag);
                    selectChapter(selectedChapter);
                  }}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                    filterTag === tag
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-text-muted"
                  }`}
                >
                  {tag === "all" ? "全部" : tagLabels[tag]?.label}
                </button>
              ))}
            </div>
          </div>

          {knowledgePoints.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">该分类下暂无知知识点</p>
          ) : (
            <div className="space-y-2">
              {knowledgePoints.map((kp) => (
                <div key={kp.id} className="bg-card rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{kp.title}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${tagLabels[kp.tag]?.className}`}>
                          {tagLabels[kp.tag]?.label}
                        </span>
                      </div>
                      {kp.description && (
                        <p className="text-xs text-text-muted mt-1">{kp.description}</p>
                      )}

                      {/* Attached videos */}
                      {videos[kp.id] && videos[kp.id].length > 0 && (
                        <div className="mt-2 space-y-1">
                          {videos[kp.id].map((v) => (
                            <a
                              key={v.id}
                              href={v.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                            >
                              🎬 {v.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Learning status (student only) */}
                  {profile?.role === "student" && (
                    <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${learnedColors[learnedPoints[kp.id] || "not_started"]}`}>
                        {learnedLabels[learnedPoints[kp.id] || "not_started"]}
                      </span>
                      <select
                        value={learnedPoints[kp.id] || "not_started"}
                        onChange={(e) => updateLearnedStatus(kp.id, e.target.value)}
                        className="text-xs border border-border rounded-lg px-2 py-1 bg-white"
                      >
                        <option value="not_started">标记未学</option>
                        <option value="learning">标记学习中</option>
                        <option value="mastered">标记已掌握</option>
                        <option value="weak">标记薄弱</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-text-muted font-medium">{title}</p>
      <p className="text-text-muted text-sm mt-1">{description}</p>
    </div>
  );
}
