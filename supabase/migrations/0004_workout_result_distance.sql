alter table public.workout_results
  add column if not exists distance_m numeric check (distance_m > 0);
