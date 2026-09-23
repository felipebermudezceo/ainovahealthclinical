create table if not exists public.doctors (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  specialty text not null default '',
  professional_license text not null default '',
  phone text not null default '',
  signature_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_histories (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  patient_full_name text not null,
  patient_document text not null,
  patient_birth_date date not null,
  patient_email text not null,
  patient_phone text not null,
  patient_address text not null default '',
  patient_city text not null default '',
  patient_gender text not null default '',
  consultation_date date not null,
  consultation_time text not null default '',
  reason text not null,
  current_illness text not null default '',
  medical_history text not null default '',
  personal_history text not null default '',
  family_history text not null default '',
  surgical_history text not null default '',
  pharmacological_history text not null default '',
  allergies text not null default '',
  allergic_history text not null default '',
  gynecological_obstetric_history text not null default '',
  blood_pressure text not null default '',
  heart_rate text not null default '',
  respiratory_rate text not null default '',
  temperature text not null default '',
  oxygen_saturation text not null default '',
  weight text not null default '',
  height text not null default '',
  bmi text not null default '',
  physical_exam text not null default '',
  general_appearance text not null default '',
  head_and_neck text not null default '',
  cardiovascular_exam text not null default '',
  respiratory_exam text not null default '',
  abdominal_exam text not null default '',
  neurological_exam text not null default '',
  musculoskeletal_exam text not null default '',
  other_physical_findings text not null default '',
  diagnosis text not null,
  secondary_diagnoses text not null default '',
  clinical_impression text not null default '',
  medications text not null default '',
  treatment_plan text not null,
  medical_recommendations text not null default '',
  requested_exams text not null default '',
  referrals text not null default '',
  follow_up text not null default '',
  observations text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clinical_histories_doctor_id_idx
  on public.clinical_histories (doctor_id);

alter table public.doctors enable row level security;
alter table public.clinical_histories enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'doctors'
      and policyname = 'doctors_select_own'
  ) then
    create policy "doctors_select_own"
      on public.doctors
      for select
      to authenticated
      using (id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'doctors'
      and policyname = 'doctors_update_own'
  ) then
    create policy "doctors_update_own"
      on public.doctors
      for update
      to authenticated
      using (id = auth.uid())
      with check (id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'clinical_histories'
      and policyname = 'histories_select_own'
  ) then
    create policy "histories_select_own"
      on public.clinical_histories
      for select
      to authenticated
      using (doctor_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'clinical_histories'
      and policyname = 'histories_insert_own'
  ) then
    create policy "histories_insert_own"
      on public.clinical_histories
      for insert
      to authenticated
      with check (doctor_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'clinical_histories'
      and policyname = 'histories_update_own'
  ) then
    create policy "histories_update_own"
      on public.clinical_histories
      for update
      to authenticated
      using (doctor_id = auth.uid())
      with check (doctor_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'clinical_histories'
      and policyname = 'histories_delete_own'
  ) then
    create policy "histories_delete_own"
      on public.clinical_histories
      for delete
      to authenticated
      using (doctor_id = auth.uid());
  end if;
end $$;

create or replace function public.handle_new_doctor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.doctors (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row
      execute function public.handle_new_doctor();
  end if;
end $$;

create or replace function public.set_clinical_history_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'clinical_histories_set_updated_at'
      and tgrelid = 'public.clinical_histories'::regclass
  ) then
    create trigger clinical_histories_set_updated_at
      before update on public.clinical_histories
      for each row
      execute function public.set_clinical_history_updated_at();
  end if;
end $$;

grant select, update on table public.doctors to authenticated;

grant select, insert, update, delete on table public.clinical_histories to authenticated;

alter table public.clinical_histories
  add column if not exists patient_address text not null default '',
  add column if not exists patient_city text not null default '',
  add column if not exists patient_gender text not null default '',
  add column if not exists consultation_time text not null default '',
  add column if not exists personal_history text not null default '',
  add column if not exists family_history text not null default '',
  add column if not exists surgical_history text not null default '',
  add column if not exists pharmacological_history text not null default '',
  add column if not exists allergic_history text not null default '',
  add column if not exists gynecological_obstetric_history text not null default '',
  add column if not exists blood_pressure text not null default '',
  add column if not exists heart_rate text not null default '',
  add column if not exists respiratory_rate text not null default '',
  add column if not exists temperature text not null default '',
  add column if not exists oxygen_saturation text not null default '',
  add column if not exists weight text not null default '',
  add column if not exists height text not null default '',
  add column if not exists bmi text not null default '',
  add column if not exists general_appearance text not null default '',
  add column if not exists head_and_neck text not null default '',
  add column if not exists cardiovascular_exam text not null default '',
  add column if not exists respiratory_exam text not null default '',
  add column if not exists abdominal_exam text not null default '',
  add column if not exists neurological_exam text not null default '',
  add column if not exists musculoskeletal_exam text not null default '',
  add column if not exists other_physical_findings text not null default '',
  add column if not exists secondary_diagnoses text not null default '',
  add column if not exists clinical_impression text not null default '',
  add column if not exists medical_recommendations text not null default '',
  add column if not exists requested_exams text not null default '',
  add column if not exists referrals text not null default '',
  add column if not exists follow_up text not null default '';
