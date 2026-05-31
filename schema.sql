-- STUDY SUPERVISOR DATABASE SCHEMA
-- Run this in Supabase SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('supervisor', 'student')),
  display_name TEXT NOT NULL,
  grade TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects (grade-level subjects)
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapters within a subject
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge points within chapters (tagged: common/required/difficult)
CREATE TABLE knowledge_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  tag TEXT NOT NULL CHECK (tag IN ('common', 'required', 'difficult')),
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bilibili videos linked to knowledge points
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_point_id UUID NOT NULL REFERENCES knowledge_points(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  bilibili_bv TEXT,
  quiz_question TEXT,
  quiz_answer TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly goals (created by supervisor)
CREATE TABLE weekly_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  student_id UUID NOT NULL REFERENCES profiles(id),
  week_start DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily tasks (broken down by student under a weekly goal)
CREATE TABLE daily_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  weekly_goal_id UUID NOT NULL REFERENCES weekly_goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_id UUID REFERENCES videos(id),
  day DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  note TEXT,
  quiz_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adjustment requests (student requests plan changes)
CREATE TABLE adjustment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES daily_tasks(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES weekly_goals(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  proposed_change TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  responded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learned status tracking for knowledge points
CREATE TABLE learned_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  knowledge_point_id UUID NOT NULL REFERENCES knowledge_points(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'learning', 'mastered', 'weak')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, knowledge_point_id)
);

-- Create indexes
CREATE INDEX idx_chapters_subject ON chapters(subject_id);
CREATE INDEX idx_knowledge_points_chapter ON knowledge_points(chapter_id);
CREATE INDEX idx_videos_kp ON videos(knowledge_point_id);
CREATE INDEX idx_weekly_goals_student ON weekly_goals(student_id);
CREATE INDEX idx_daily_tasks_goal ON daily_tasks(weekly_goal_id);
CREATE INDEX idx_adjustment_status ON adjustment_requests(status);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjustment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_points ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, update only their own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Subjects/Chapters/Knowledge Points: readable by all authenticated users
CREATE POLICY "subjects_select" ON subjects FOR SELECT USING (true);
CREATE POLICY "chapters_select" ON chapters FOR SELECT USING (true);
CREATE POLICY "knowledge_points_select" ON knowledge_points FOR SELECT USING (true);

-- Videos: readable by all, writable by supervisor
CREATE POLICY "videos_select" ON videos FOR SELECT USING (true);
CREATE POLICY "videos_insert" ON videos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor')
);
CREATE POLICY "videos_delete" ON videos FOR DELETE USING (
  auth.uid() = created_by
);

-- Weekly goals: supervisor sees goals they created, student sees goals assigned to them
CREATE POLICY "goals_select" ON weekly_goals FOR SELECT USING (
  created_by = auth.uid() OR student_id = auth.uid()
);
CREATE POLICY "goals_insert" ON weekly_goals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor')
);
CREATE POLICY "goals_update" ON weekly_goals FOR UPDATE USING (
  created_by = auth.uid() OR student_id = auth.uid()
);

-- Daily tasks
CREATE POLICY "tasks_select" ON daily_tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM weekly_goals
    WHERE weekly_goals.id = daily_tasks.weekly_goal_id
    AND (weekly_goals.created_by = auth.uid() OR weekly_goals.student_id = auth.uid())
  )
);
CREATE POLICY "tasks_insert" ON daily_tasks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM weekly_goals
    WHERE weekly_goals.id = daily_tasks.weekly_goal_id
    AND weekly_goals.student_id = auth.uid()
  )
);
CREATE POLICY "tasks_update" ON daily_tasks FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM weekly_goals
    WHERE weekly_goals.id = daily_tasks.weekly_goal_id
    AND (weekly_goals.created_by = auth.uid() OR weekly_goals.student_id = auth.uid())
  )
);

-- Adjustment requests
CREATE POLICY "adj_select" ON adjustment_requests FOR SELECT USING (
  requested_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor'
  )
);
CREATE POLICY "adj_insert" ON adjustment_requests FOR INSERT WITH CHECK (
  requested_by = auth.uid()
);
CREATE POLICY "adj_update" ON adjustment_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor')
);

-- Learned points: student manages own, supervisor can view
CREATE POLICY "learned_select" ON learned_points FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor')
);
CREATE POLICY "learned_insert" ON learned_points FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "learned_update" ON learned_points FOR UPDATE USING (user_id = auth.uid());
