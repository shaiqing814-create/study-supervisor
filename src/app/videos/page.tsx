"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import type { Video, Subject, Chapter, KnowledgePoint, Profile } from "@/lib/database.types";

export default function VideosPage() {
  return (
    <AppShell>
      <VideoManager />
    </AppShell>
  );
}

function VideoManager() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedKp, setSelectedKp] = useState("");
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizAnswer, setQuizAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profile) setProfile(profile as Profile);

      const { data: videos } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (videos) setVideos(videos as Video[]);

      const { data: subjects } = await supabase.from("subjects").select("*").order("display_order");
      if (subjects) setSubjects(subjects as Subject[]);

      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleSubjectChange(subjectId: string) {
    setSelectedSubject(subjectId);
    setSelectedChapter("");
    setSelectedKp("");
    const { data: chapters } = await supabase
      .from("chapters")
      .select("*")
      .eq("subject_id", subjectId)
      .order("display_order");
    if (chapters) setChapters(chapters as Chapter[]);
  }

  async function handleChapterChange(chapterId: string) {
    setSelectedChapter(chapterId);
    setSelectedKp("");
    const { data: points } = await supabase
      .from("knowledge_points")
      .select("*")
      .eq("chapter_id", chapterId)
      .order("display_order");
    if (points) setKnowledgePoints(points as KnowledgePoint[]);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!url || !title || !selectedKp) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const bvMatch = url.match(/BV[a-zA-Z0-9]+/);
    const bv = bvMatch ? bvMatch[0] : null;

    await supabase.from("videos").insert({
      url,
      title,
      knowledge_point_id: selectedKp,
      bilibili_bv: bv,
      quiz_question: quizQuestion || null,
      quiz_answer: quizAnswer || null,
      created_by: user.id,
    });

    setUrl(""); setTitle(""); setSelectedKp(""); setQuizQuestion(""); setQuizAnswer("");
    setShowAdd(false);
    setSaving(false);

    const { data: videos } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });
    if (videos) setVideos(videos as Video[]);
  }

  async function handleDelete(videoId: string) {
    if (!confirm("确认删除这个视频？")) return;
    await supabase.from("videos").delete().eq("id", videoId);
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
  }

  // Extract BV from URL for embed
  const getEmbedUrl = (url: string) => {
    const bvMatch = url.match(/BV[a-zA-Z0-9]+/);
    if (bvMatch) return `https://player.bilibili.com/player.html?bvid=${bvMatch[0]}`;
    return null;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">🎬 视频资源</h1>
        {profile?.role === "supervisor" && (
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            + 导入视频
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-20 rounded-xl" />
          <div className="skeleton h-20 rounded-xl" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🎬</div>
          <p className="text-text-muted">还没有导入视频</p>
          {profile?.role === "supervisor" && (
            <button
              onClick={() => setShowAdd(true)}
              className="text-primary text-sm font-medium mt-2"
            >
              从B站导入第一个视频
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <div key={video.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{video.title}</h3>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    {video.url.length > 50 ? video.url.slice(0, 50) + "..." : video.url}
                  </a>
                  {video.bilibili_bv && (
                    <p className="text-xs text-text-muted mt-0.5">BV: {video.bilibili_bv}</p>
                  )}
                  {video.quiz_question && (
                    <p className="text-xs text-text-muted mt-1">📝 验证题：{video.quiz_question}</p>
                  )}
                </div>
                {profile?.role === "supervisor" && (
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="text-xs text-danger hover:underline shrink-0"
                  >
                    删除
                  </button>
                )}
              </div>
              {/* Bilibili embed preview */}
              {video.bilibili_bv && (
                <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-black">
                  <iframe
                    src={getEmbedUrl(video.url)!}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add video modal */}
      {showAdd && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
          <div className="relative bg-card rounded-2xl p-5 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleAdd} className="space-y-3">
              <h3 className="font-semibold text-text">导入B站视频</h3>

              <div>
                <label className="block text-xs font-medium text-text mb-1">视频链接 *</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.bilibili.com/video/BV..."
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">视频标题 *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="如：三角函数图像变换精讲"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">关联学科 *</label>
                <select
                  required
                  value={selectedSubject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                >
                  <option value="">选择学科</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.grade} · {s.name}</option>
                  ))}
                </select>
              </div>

              {selectedSubject && (
                <div>
                  <label className="block text-xs font-medium text-text mb-1">关联章节 *</label>
                  <select
                    required
                    value={selectedChapter}
                    onChange={(e) => handleChapterChange(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  >
                    <option value="">选择章节</option>
                    {chapters.map((ch) => (
                      <option key={ch.id} value={ch.id}>{ch.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedChapter && (
                <div>
                  <label className="block text-xs font-medium text-text mb-1">关联知识点 *</label>
                  <select
                    required
                    value={selectedKp}
                    onChange={(e) => setSelectedKp(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  >
                    <option value="">选择知识点</option>
                    {knowledgePoints.map((kp) => (
                      <option key={kp.id} value={kp.id}>
                        {kp.title} ({kp.tag === "required" ? "必考" : kp.tag === "common" ? "常考" : "难点"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-text mb-1">验证题（选填）</label>
                <input
                  type="text"
                  value={quizQuestion}
                  onChange={(e) => setQuizQuestion(e.target.value)}
                  placeholder="如：三角函数的最小正周期公式是什么？"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">验证题答案（选填）</label>
                <input
                  type="text"
                  value={quizAnswer}
                  onChange={(e) => setQuizAnswer(e.target.value)}
                  placeholder="如：T=2π/|ω|"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <button
                type="submit"
                disabled={saving || !url || !title || !selectedKp}
                className="w-full py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {saving ? "保存中..." : "导入视频"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
