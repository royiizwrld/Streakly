CREATE TABLE public.habit_categories (
  user_id uuid NOT NULL,
  id text NOT NULL,
  name text NOT NULL,
  built_in boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
CREATE TABLE public.habit_routines (
  user_id uuid NOT NULL,
  id text NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '🕐',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
CREATE TABLE public.habits (
  user_id uuid NOT NULL,
  id text NOT NULL,
  name text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  category_id text NOT NULL DEFAULT 'other',
  routine_id text,
  frequency jsonb NOT NULL DEFAULT '{"type":"daily"}'::jsonb,
  reminder text,
  archived boolean NOT NULL DEFAULT false,
  created_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
CREATE TABLE public.habit_logs (
  user_id uuid NOT NULL,
  habit_id text NOT NULL,
  day date NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, habit_id, day)
);
CREATE TABLE public.habit_goals (
  user_id uuid NOT NULL,
  id text NOT NULL,
  name text NOT NULL,
  habit_id text NOT NULL,
  target_days integer NOT NULL,
  start_date date NOT NULL,
  mode text NOT NULL DEFAULT 'total',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
CREATE TABLE public.habit_celebrations (
  user_id uuid NOT NULL,
  day date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_categories, public.habit_routines, public.habits, public.habit_logs, public.habit_goals, public.habit_celebrations TO authenticated;
GRANT ALL ON public.habit_categories, public.habit_routines, public.habits, public.habit_logs, public.habit_goals, public.habit_celebrations TO service_role;
GRANT DELETE ON public.profiles TO service_role;

ALTER TABLE public.habit_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_celebrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own categories" ON public.habit_categories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own routines" ON public.habit_routines FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own habits" ON public.habits FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own logs" ON public.habit_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own goals" ON public.habit_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own celebrations" ON public.habit_celebrations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX habit_logs_user_day_idx ON public.habit_logs (user_id, day);