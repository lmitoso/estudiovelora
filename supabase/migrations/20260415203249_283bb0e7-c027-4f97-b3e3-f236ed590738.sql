
-- Function: when a lead is inserted, link to existing conversations
CREATE OR REPLACE FUNCTION public.link_lead_to_conversations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.whatsapp IS NOT NULL AND NEW.whatsapp <> '' THEN
    UPDATE conversations
    SET lead_id = NEW.id
    WHERE lead_id IS NULL
      AND whatsapp_number = NEW.whatsapp;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_link_lead_to_conversations
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.link_lead_to_conversations();

-- Function: when a conversation is created, link to existing lead
CREATE OR REPLACE FUNCTION public.link_conversation_to_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_lead_id uuid;
BEGIN
  SELECT id INTO found_lead_id
  FROM leads
  WHERE whatsapp = NEW.whatsapp_number
  LIMIT 1;

  IF found_lead_id IS NOT NULL THEN
    NEW.lead_id := found_lead_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_link_conversation_to_lead
BEFORE INSERT ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.link_conversation_to_lead();
