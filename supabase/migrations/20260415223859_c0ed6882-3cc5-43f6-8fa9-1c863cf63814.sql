
-- Fix link_conversation_to_lead to normalize numbers robustly
CREATE OR REPLACE FUNCTION public.link_conversation_to_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_lead_id uuid;
  conv_digits text;
BEGIN
  -- Extract only digits from conversation number
  conv_digits := regexp_replace(NEW.whatsapp_number, '[^0-9]', '', 'g');
  -- Remove country code 55 if present
  IF left(conv_digits, 2) = '55' AND length(conv_digits) > 11 THEN
    conv_digits := substring(conv_digits from 3);
  END IF;

  SELECT id INTO found_lead_id FROM leads
  WHERE regexp_replace(whatsapp, '[^0-9]', '', 'g') = conv_digits
     OR regexp_replace(
          regexp_replace(whatsapp, '[^0-9]', '', 'g'),
          '^55', ''
        ) = conv_digits
  LIMIT 1;

  IF found_lead_id IS NOT NULL THEN
    NEW.lead_id := found_lead_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure trigger exists on conversations
DROP TRIGGER IF EXISTS trg_link_conversation_to_lead ON conversations;
CREATE TRIGGER trg_link_conversation_to_lead
  BEFORE INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.link_conversation_to_lead();

-- Retroactively fix unlinked conversations
UPDATE conversations c
SET lead_id = l.id
FROM leads l
WHERE c.lead_id IS NULL
  AND l.whatsapp IS NOT NULL
  AND (
    regexp_replace(l.whatsapp, '[^0-9]', '', 'g') = 
      CASE 
        WHEN left(regexp_replace(c.whatsapp_number, '[^0-9]', '', 'g'), 2) = '55' 
             AND length(regexp_replace(c.whatsapp_number, '[^0-9]', '', 'g')) > 11
        THEN substring(regexp_replace(c.whatsapp_number, '[^0-9]', '', 'g') from 3)
        ELSE regexp_replace(c.whatsapp_number, '[^0-9]', '', 'g')
      END
    OR regexp_replace(regexp_replace(l.whatsapp, '[^0-9]', '', 'g'), '^55', '') = 
      CASE 
        WHEN left(regexp_replace(c.whatsapp_number, '[^0-9]', '', 'g'), 2) = '55' 
             AND length(regexp_replace(c.whatsapp_number, '[^0-9]', '', 'g')) > 11
        THEN substring(regexp_replace(c.whatsapp_number, '[^0-9]', '', 'g') from 3)
        ELSE regexp_replace(c.whatsapp_number, '[^0-9]', '', 'g')
      END
  );
