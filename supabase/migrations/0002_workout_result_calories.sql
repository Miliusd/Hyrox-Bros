alter table public.workout_results
  add column if not exists calories integer check (calories > 0);
