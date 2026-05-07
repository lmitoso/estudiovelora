
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS handoff_status text NOT NULL DEFAULT 'luna',
  ADD COLUMN IF NOT EXISTS handoff_at timestamptz,
  ADD COLUMN IF NOT EXISTS briefing jsonb;

ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_messages REPLICA IDENTITY FULL;
ALTER TABLE public.leads REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
