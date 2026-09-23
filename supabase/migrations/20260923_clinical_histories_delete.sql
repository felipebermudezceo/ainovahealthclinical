do $$
begin
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

grant delete on table public.clinical_histories to authenticated;
