-- ==============================================================================
-- Inearly - India-First AI Mental Wellness Platform
-- Database Schema Migration (Supabase / PostgreSQL)
-- Architecture: Zero-PII, Data Minimization & DPDP Act (2023) Compliance Ready
-- ==============================================================================

-- 0. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Mode Enum: 'listen' (empathetic venting) | 'plan' (structured coping & action)
CREATE TYPE conversation_mode AS ENUM ('listen', 'plan');

-- Message Role Enum: 'user' | 'assistant'
CREATE TYPE message_role AS ENUM ('user', 'assistant');

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- Privacy principle: Zero PII (no real names, phone numbers, Aadhaar, or emails in plain core table).
-- Uses coarse age_band instead of exact date of birth to minimize age-verification footprint.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    age_band TEXT NOT NULL CHECK (age_band IN ('13-17', '18-24', '25-34', '35-49', '50+')),
    pseudonym TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.users IS 'Stores pseudonymized user accounts with coarse age bands minimizing demographic PII.';
COMMENT ON COLUMN public.users.age_band IS 'Coarse age band compliant with data minimization (e.g., 18-24).';
COMMENT ON COLUMN public.users.pseudonym IS 'User-selected or randomly generated non-identifying moniker.';

-- ------------------------------------------------------------------------------
-- 2. CONSENTS TABLE
-- DPDP Act (2023) Principle: Explicit, purpose-specific, verifiable, and revocable consent.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    version TEXT NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    withdrawn_at TIMESTAMPTZ,
    CONSTRAINT check_consent_timeline CHECK (withdrawn_at IS NULL OR withdrawn_at >= granted_at)
);

CREATE INDEX IF NOT EXISTS idx_consents_user_purpose ON public.consents(user_id, purpose);
CREATE INDEX IF NOT EXISTS idx_consents_active ON public.consents(user_id) WHERE withdrawn_at IS NULL;

COMMENT ON TABLE public.consents IS 'Granular consent tracking complying with DPDP Act 2023. Records grant and withdrawal dates per purpose.';

-- ------------------------------------------------------------------------------
-- 3. CONVERSATIONS TABLE
-- Data minimization principle: Pre-configured retention expiry (e.g., 30-90 days default).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    mode conversation_mode NOT NULL DEFAULT 'listen',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    retention_expiry TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_retention ON public.conversations(retention_expiry);

COMMENT ON TABLE public.conversations IS 'Sessions categorised by mode with strict lifecycle retention expiries.';

-- ------------------------------------------------------------------------------
-- 4. MESSAGES TABLE
-- Privacy principle: Zero raw plaintext storage of mental health transcripts.
-- Encrypted at application/envelope layer or reference to client-side zero-knowledge vault.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    encrypted_content_or_reference TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, timestamp ASC);

COMMENT ON TABLE public.messages IS 'Encrypted mental wellness exchange logs; no raw plaintext queries allowed.';

-- ------------------------------------------------------------------------------
-- 5. CONCERN_TAGS TABLE
-- Safe context classification: Tentative AI categorization requiring user validation.
-- Minimizes biased diagnostics and ensures user empowerment.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.concern_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    tentative_flag BOOLEAN NOT NULL DEFAULT true,
    user_confirmed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_concern_tags_conversation ON public.concern_tags(conversation_id);

COMMENT ON TABLE public.concern_tags IS 'AI-inferred concern themes marked tentative until explicitly acknowledged or confirmed by user.';

-- ------------------------------------------------------------------------------
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- Strict isolation using auth.uid() matching public.users(id)
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concern_tags ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Consents policies
CREATE POLICY "Users can view own consents"
    ON public.consents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents"
    ON public.consents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update (withdraw) own consents"
    ON public.consents FOR UPDATE
    USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations"
    ON public.conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
    ON public.conversations FOR DELETE
    USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in own conversations"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages into own conversations"
    ON public.messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()
        )
    );

-- Concern tags policies
CREATE POLICY "Users can view concern tags of own conversations"
    ON public.concern_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = concern_tags.conversation_id AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update/confirm concern tags of own conversations"
    ON public.concern_tags FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = concern_tags.conversation_id AND c.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- AUTOMATED DATA MINIMIZATION & RETENTION PRUNING ROUTINE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prune_expired_conversations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.conversations
    WHERE retention_expiry <= timezone('utc'::text, now());
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.prune_expired_conversations IS 'Scheduled job function to hard-delete conversations and cascaded messages after retention expiry.';
