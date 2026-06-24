-- ============================================================
--  FCTHub — Supabase Schema SQL
--  Corre este script no SQL Editor do Supabase
--  (Database → SQL Editor → New Query)
-- ============================================================

-- 1. PROFILES (ligado ao auth.users)
CREATE TABLE public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  email            TEXT,
  role             TEXT NOT NULL DEFAULT 'aluno' CHECK (role IN ('aluno','professor','admin')),
  avatar_initials  TEXT DEFAULT 'U',
  turma_id         UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
  active           BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TURMAS
CREATE TABLE public.turmas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  professor_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROJECTS
CREATE TABLE public.projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  empresa     TEXT,
  author_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  turma_id    UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
  status      TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','em_progresso','concluido','cancelado')),
  tags        TEXT[] DEFAULT '{}',
  rating      INT DEFAULT 0,
  rating_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VERSIONS (commits)
CREATE TABLE public.versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','rejeitado')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COMMENTS
CREATE TABLE public.comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FILES (metadata — real file in Storage)
CREATE TABLE public.files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT,
  size         BIGINT,
  storage_path TEXT NOT NULL,
  public_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 7. NOTIFICATIONS
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT,
  text       TEXT NOT NULL,
  link       TEXT,
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EVENTS (calendar)
CREATE TABLE public.events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  date       DATE NOT NULL,
  type       TEXT DEFAULT 'other' CHECK (type IN ('deadline','meeting','submission','other')),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ACTIVITY
CREATE TABLE public.activity (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT,
  text       TEXT,
  target     TEXT,
  target_id  UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  AUTO-CREATE PROFILE on sign up (trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, avatar_initials)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'aluno'),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 2))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
--  ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity      ENABLE ROW LEVEL SECURITY;

-- profiles: todos podem ver, só o próprio (ou admin) edita
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- turmas: todos veem, só prof/admin gere
CREATE POLICY "turmas_select" ON public.turmas FOR SELECT USING (true);
CREATE POLICY "turmas_insert" ON public.turmas FOR INSERT WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('professor','admin'));
CREATE POLICY "turmas_delete" ON public.turmas FOR DELETE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- projects: todos veem; alunos criam os seus; prof/admin atualizam
CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (true);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING (auth.uid() = author_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('professor','admin'));
CREATE POLICY "projects_delete" ON public.projects FOR DELETE USING (auth.uid() = author_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- versions
CREATE POLICY "versions_select" ON public.versions FOR SELECT USING (true);
CREATE POLICY "versions_insert" ON public.versions FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "versions_update" ON public.versions FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('professor','admin'));

-- comments
CREATE POLICY "comments_select" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_delete" ON public.comments FOR DELETE USING (auth.uid() = author_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('professor','admin'));

-- files
CREATE POLICY "files_select" ON public.files FOR SELECT USING (true);
CREATE POLICY "files_insert" ON public.files FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "files_delete" ON public.files FOR DELETE USING (auth.uid() = author_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('professor','admin'));

-- notifications: só o próprio vê e gere as suas
CREATE POLICY "notif_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notif_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- events
CREATE POLICY "events_select" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_insert" ON public.events FOR INSERT WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('professor','admin'));
CREATE POLICY "events_delete" ON public.events FOR DELETE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('professor','admin'));

-- activity
CREATE POLICY "activity_select" ON public.activity FOR SELECT USING (true);
CREATE POLICY "activity_insert" ON public.activity FOR INSERT WITH CHECK (true);

-- ============================================================
--  STORAGE — criar bucket no Dashboard:
--  Storage → New Bucket → Name: "project-files" → Public: ON
-- ============================================================
