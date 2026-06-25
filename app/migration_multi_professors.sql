-- ============================================================
--  FCTHub — Migration: Múltiplos Professores por Turma
--  Corre este script no SQL Editor do Supabase
--  (Database → SQL Editor → New Query)
-- ============================================================

-- 1. Criar tabela junction turma_professors
CREATE TABLE IF NOT EXISTS public.turma_professors (
    turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE,
    professor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (turma_id, professor_id)
);

-- 2. RLS
ALTER TABLE public.turma_professors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "turma_professors_select" ON public.turma_professors
  FOR SELECT USING (true);

CREATE POLICY "turma_professors_insert" ON public.turma_professors
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('professor', 'admin')
  );

CREATE POLICY "turma_professors_delete" ON public.turma_professors
  FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('professor', 'admin')
  );

-- 3. Adicionar policy UPDATE na turmas (faltava no schema original!)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'turmas_update' AND tablename = 'turmas') THEN
    CREATE POLICY "turmas_update" ON public.turmas FOR UPDATE USING (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('professor', 'admin')
    );
  END IF;
END $$;

-- 4. Migrar dados existentes (professor_id → turma_professors)
INSERT INTO public.turma_professors (turma_id, professor_id)
SELECT id, professor_id FROM public.turmas WHERE professor_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5. Remover coluna antiga
ALTER TABLE public.turmas DROP COLUMN IF EXISTS professor_id;
