-- Add dark_mode column to user_settings table
ALTER TABLE public.user_settings ADD COLUMN dark_mode boolean DEFAULT false;
