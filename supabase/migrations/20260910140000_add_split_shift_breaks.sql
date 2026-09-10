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

commit;
