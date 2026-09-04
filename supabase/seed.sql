-- Replace all five addresses and names before running this file.
-- Keep one person as coach; the other four may remain athletes.
insert into public.allowed_members(email,display_name,role) values
('milius99@gmail.com','Dainius','coach'),
('vaidmas123@gmail.com','Masas','athlete'),
('Kristupas.pole@gmail.com','Kristis','athlete'),
('taduskis9@gmail.com','Tadelis','athlete'),
('pliutikas15@gmail.com','Liova','athlete')
on conflict(email) do update set display_name=excluded.display_name, role=excluded.role;
