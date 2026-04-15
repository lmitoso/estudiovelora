
-- Fix: normalize whatsapp comparison to handle +55 prefix differences
CREATE OR REPLACE FUNCTION public.link_lead_to_conversations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_whatsapp text;
BEGIN
  IF NEW.whatsapp IS NOT NULL AND NEW.whatsapp <> '' THEN
    -- Normalize: strip non-digits, ensure +55 prefix
    normalized_whatsapp := regexp_replace(NEW.whatsapp, '[^0-9]', '', 'g');
    IF left(normalized_whatsapp, 2) = '55' THEN
      normalized_whatsapp := '+' || normalized_whatsapp;
    ELSE
      normalized_whatsapp := '+55' || normalized_whatsapp;
    END IF;

    UPDATE conversations
    SET lead_id = NEW.id
    WHERE lead_id IS NULL
      AND whatsapp_number = normalized_whatsapp;
  END IF;
  RETURN NEW;
END;
$$;

-- Also fix the reverse trigger
CREATE OR REPLACE FUNCTION public.link_conversation_to_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_lead_id uuid;
  stripped_number text;
BEGIN
  -- Strip + prefix for comparison with leads.whatsapp (which may not have +)
  stripped_number := regexp_replace(NEW.whatsapp_number, '^\+', '');

  SELECT id INTO found_lead_id
  FROM leads
  WHERE whatsapp = NEW.whatsapp_number
     OR whatsapp = stripped_number
  LIMIT 1;

  IF found_lead_id IS NOT NULL THEN
    NEW.lead_id := found_lead_id;
  END IF;
  RETURN NEW;
END;
$$;
