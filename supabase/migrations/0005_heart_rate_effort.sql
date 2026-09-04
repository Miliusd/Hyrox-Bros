alter table public.profiles
  add column if not exists max_hr_bpm integer check (max_hr_bpm between 100 and 230);

alter table public.workout_results
  add column if not exists average_hr_bpm integer check (average_hr_bpm between 40 and 230);

grant update (max_hr_bpm) on table public.profiles to authenticated;
