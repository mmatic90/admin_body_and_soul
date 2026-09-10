begin;

alter table public.employee_default_schedule
  add column if not exists break_start_time time,
  add column if not exists break_end_time time;

alter table public.employee_schedule_overrides
  add column if not exists break_start_time time,
  add column if not exists break_end_time time;

alter table public.employee_default_schedule
  drop constraint if exists employee_default_schedule_break_pair_check,
  drop constraint if exists employee_default_schedule_break_inside_hours_check;

alter table public.employee_default_schedule
  add constraint employee_default_schedule_break_pair_check
  check (
    (break_start_time is null and break_end_time is null)
    or
    (break_start_time is not null and break_end_time is not null)
  ),
  add constraint employee_default_schedule_break_inside_hours_check
  check (
    break_start_time is null
    or (
      is_working = true
      and start_time < break_start_time
      and break_start_time < break_end_time
      and break_end_time < end_time
    )
  );

alter table public.employee_schedule_overrides
  drop constraint if exists employee_schedule_overrides_break_pair_check,
  drop constraint if exists employee_schedule_overrides_break_inside_hours_check;

alter table public.employee_schedule_overrides
  add constraint employee_schedule_overrides_break_pair_check
  check (
    (break_start_time is null and break_end_time is null)
    or
    (break_start_time is not null and break_end_time is not null)
  ),
  add constraint employee_schedule_overrides_break_inside_hours_check
  check (
    break_start_time is null
    or (
      override_type = 'custom_hours'
      and start_time < break_start_time
      and break_start_time < break_end_time
      and break_end_time < end_time
    )
  );

-- Final safety net: any newly created appointment (including one accepted from
-- an older online-booking request) is rejected if it overlaps the employee's
-- effective break. Status-only updates are intentionally not checked so that
-- legacy appointments can still be marked completed/cancelled/no-show.
create or replace function public.enforce_appointment_employee_break()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_break_start time;
  v_break_end time;
  v_override_type text;
begin
  if new.employee_id is null
     or new.appointment_date is null
     or new.start_time is null
     or new.end_time is null then
    return new;
  end if;

  select o.override_type, o.break_start_time, o.break_end_time
    into v_override_type, v_break_start, v_break_end
  from public.employee_schedule_overrides o
  where o.employee_id = new.employee_id
    and o.override_date = new.appointment_date
  limit 1;

  if not found or v_override_type <> 'custom_hours' then
    select d.break_start_time, d.break_end_time
      into v_break_start, v_break_end
    from public.employee_default_schedule d
    where d.employee_id = new.employee_id
      and d.day_of_week = extract(dow from new.appointment_date)::integer
    limit 1;
  end if;

  if v_break_start is not null
     and v_break_end is not null
     and new.start_time < v_break_end
     and v_break_start < new.end_time then
    raise exception 'Termin se preklapa s pauzom zaposlenika (% - %).',
      to_char(v_break_start, 'HH24:MI'),
      to_char(v_break_end, 'HH24:MI')
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_employee_break_guard on public.appointments;
create trigger appointments_employee_break_guard
before insert or update of appointment_date, start_time, end_time, employee_id
on public.appointments
for each row
execute function public.enforce_appointment_employee_break();

commit;
