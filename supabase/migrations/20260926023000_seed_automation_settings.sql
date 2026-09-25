insert into public.settings (type, value)
values
  ('AUTOMATION_ENABLED','on'),
  ('EMAIL_NOTIFICATIONS','off'),
  ('REMINDER_HOURS_BEFORE','24'),
  ('OVERDUE_ESCALATION','on'),
  ('AUTOMATION_TIMEZONE','Africa/Cairo'),
  ('CALENDAR_REMINDERS_ENABLED','on'),
  ('CALENDAR_REMINDER_DAY_BEFORE','on'),
  ('CALENDAR_REMINDER_HOURS','2')
on conflict (type) do nothing;
