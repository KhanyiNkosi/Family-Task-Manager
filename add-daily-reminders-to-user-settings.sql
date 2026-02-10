-- Add daily_reminders column to user_settings table
ALTER TABLE public.user_settings ADD COLUMN daily_reminders boolean DEFAULT true;
-- Add weekly_reports column to user_settings table
ALTER TABLE public.user_settings ADD COLUMN weekly_reports boolean DEFAULT false;
