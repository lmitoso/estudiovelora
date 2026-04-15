
-- Conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  whatsapp_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  stage TEXT NOT NULL DEFAULT 'greeting',
  context_summary TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  next_follow_up_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to conversations" ON public.conversations FOR SELECT USING (false);

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Conversation messages table
CREATE TABLE public.conversation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  twilio_sid TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to conversation_messages" ON public.conversation_messages FOR SELECT USING (false);

-- Follow-up schedule table
CREATE TABLE public.follow_up_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT NOT NULL DEFAULT 'check_in',
  status TEXT NOT NULL DEFAULT 'pending',
  message_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.follow_up_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to follow_up_schedule" ON public.follow_up_schedule FOR SELECT USING (false);

-- Indexes
CREATE INDEX idx_conversations_whatsapp ON public.conversations(whatsapp_number);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversation_messages_conv_id ON public.conversation_messages(conversation_id);
CREATE INDEX idx_follow_up_schedule_pending ON public.follow_up_schedule(scheduled_at) WHERE status = 'pending';
