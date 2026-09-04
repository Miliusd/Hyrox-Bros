-- The app turns each username into username@hyroxbros.local internally.
-- Usernames must be lowercase and may contain letters, numbers, dots, dashes or underscores.
-- Keep one person as coach; the other four may remain athletes.
delete from public.allowed_members where email not like '%@hyroxbros.local';

insert into public.allowed_members(email,display_name,role) values
('milius99@hyroxbros.local','Dainius','coach'),
('vaidmas123@hyroxbros.local','Masas','athlete'),
('kristupas.pole@hyroxbros.local','Kristis','athlete'),
('taduskis9@hyroxbros.local','Tadelis','athlete'),
('pliutikas15@hyroxbros.local','Liova','athlete')
on conflict(email) do update set display_name=excluded.display_name, role=excluded.role;
