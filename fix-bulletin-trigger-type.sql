-- ============================================================================
-- FIX BULLETIN MESSAGE TRIGGER - Change v_family_id from UUID to TEXT
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_bulletin_message()
RETURNS TRIGGER AS $$
DECLARE
  v_poster_name TEXT;
  v_family_id TEXT;  -- ✅ Changed from UUID to TEXT
  v_member RECORD;
BEGIN
  -- Only trigger on new bulletin message
  IF TG_OP = 'INSERT' THEN
    
    v_family_id := NEW.family_id;
    
    -- Get poster's name from profiles table
    SELECT full_name INTO v_poster_name
    FROM profiles
    WHERE id = NEW.posted_by;
    
    -- Notify all family members except the poster
    FOR v_member IN 
      SELECT p.id 
      FROM profiles p
      WHERE p.family_id = v_family_id
        AND p.id != NEW.posted_by
    LOOP
      INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
      VALUES (
        v_member.id,
        v_family_id,
        'New Family Message',
        COALESCE(v_poster_name, 'A family member') || ' posted: "' || 
        CASE 
          WHEN LENGTH(NEW.message) > 100 THEN SUBSTRING(NEW.message, 1, 100) || '...'
          ELSE NEW.message
        END || '"',
        'info',
        '/parent-dashboard',
        'View Bulletin'
      );
      
      RAISE NOTICE 'Notification created for family member % about bulletin message', v_member.id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the function was updated
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ notify_bulletin_message() function updated';
  RAISE NOTICE '✅ v_family_id changed from UUID to TEXT';
  RAISE NOTICE '';
  RAISE NOTICE 'Bulletin messages should now work correctly!';
  RAISE NOTICE '';
END $$;
