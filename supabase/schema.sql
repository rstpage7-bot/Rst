-- شغّل الملف كله من Supabase > SQL Editor > New query.
-- لا تضع service_role key في الموقع أو في GitHub.

create table if not exists public.join_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  student_id text not null check (char_length(student_id) between 2 and 40),
  email text not null check (char_length(email) between 5 and 254),
  phone text not null check (char_length(phone) between 7 and 30),
  faculty text not null check (char_length(faculty) between 2 and 120),
  study_year text not null check (char_length(study_year) between 1 and 40),
  motivation text not null default '' check (char_length(motivation) <= 1000),
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.join_requests enable row level security;
alter table public.admin_profiles enable row level security;

-- الزائر يستطيع إرسال طلب فقط، ولا يستطيع قراءة الطلبات أو تعديلها.
drop policy if exists "Anyone can submit a join request" on public.join_requests;
create policy "Anyone can submit a join request"
on public.join_requests for insert to anon, authenticated
with check (
  status = 'pending'
  and char_length(full_name) between 2 and 120
  and char_length(student_id) between 2 and 40
  and char_length(email) between 5 and 254
  and char_length(phone) between 7 and 30
  and char_length(faculty) between 2 and 120
  and char_length(study_year) between 1 and 40
  and char_length(motivation) <= 1000
);

-- الملف الإداري لا يمكن لأي زائر قراءته. المستخدم المسجل يرى صفه فقط.
drop policy if exists "Users can read own admin profile" on public.admin_profiles;
create policy "Users can read own admin profile"
on public.admin_profiles for select to authenticated
using (auth.uid() = user_id);

-- صلاحيات إدارة الطلبات تمنح فقط للحساب الذي يملك is_admin=true.
drop policy if exists "Admins can read requests" on public.join_requests;
create policy "Admins can read requests"
on public.join_requests for select to authenticated
using (exists (
  select 1 from public.admin_profiles p
  where p.user_id = auth.uid() and p.is_admin = true
));

drop policy if exists "Admins can update requests" on public.join_requests;
create policy "Admins can update requests"
on public.join_requests for update to authenticated
using (exists (
  select 1 from public.admin_profiles p
  where p.user_id = auth.uid() and p.is_admin = true
))
with check (exists (
  select 1 from public.admin_profiles p
  where p.user_id = auth.uid() and p.is_admin = true
));

drop policy if exists "Admins can delete requests" on public.join_requests;
create policy "Admins can delete requests"
on public.join_requests for delete to authenticated
using (exists (
  select 1 from public.admin_profiles p
  where p.user_id = auth.uid() and p.is_admin = true
));

-- إنشاء صف صلاحيات تلقائي لأي مستخدم جديد، والصلاحية الافتراضية false.
create or replace function public.create_admin_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_profiles (user_id, is_admin)
  values (new.id, false)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_admin_profile on auth.users;
create trigger on_auth_user_created_admin_profile
after insert on auth.users
for each row execute procedure public.create_admin_profile_for_user();

-- بعد إنشاء حساب المسؤول من Supabase Authentication > Users،
-- نفّذ الاستعلام التالي مع استبدال البريد ببريد المسؤول:
-- update public.admin_profiles p
-- set is_admin = true
-- from auth.users u
-- where p.user_id = u.id and u.email = 'YOUR_ADMIN_EMAIL';
