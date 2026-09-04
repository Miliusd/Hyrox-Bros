-- RLS policies decide which rows each signed-in member may access.
-- These grants provide the underlying table privileges required for RLS to run.
grant usage on schema public to authenticated;

grant select on table public.profiles to authenticated;
revoke update on table public.profiles from authenticated;
grant update (display_name, division, threshold_pace_sec_per_km, weight_kg, emoji, goal_race_name, goal_race_date)
  on table public.profiles to authenticated;
grant select, insert, update, delete on table public.workouts to authenticated;
grant select, insert, update, delete on table public.workout_results to authenticated;
grant select, insert, update, delete on table public.station_results to authenticated;
grant select, insert, update, delete on table public.comments to authenticated;
grant select, insert, update, delete on table public.plan_templates to authenticated;
grant select, insert, update, delete on table public.plan_template_items to authenticated;
grant select, insert, update, delete on table public.allowed_members to authenticated;

grant execute on function public.is_member() to authenticated;
grant execute on function public.is_coach() to authenticated;
