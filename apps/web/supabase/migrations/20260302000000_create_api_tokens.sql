-- Create api_tokens table for MCP Integration
-- Migration: 20260302000000_create_api_tokens.sql

-- Create api_tokens table
CREATE TABLE IF NOT EXISTS public.api_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    prefix TEXT NOT NULL, -- First 12 chars of token for display (e.g., "pt_live_abcd")
    scopes JSONB NOT NULL DEFAULT '["read", "write"]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NULL,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    revoked_at TIMESTAMPTZ DEFAULT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON public.api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_token_hash ON public.api_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_api_tokens_user_active ON public.api_tokens(user_id)
    WHERE revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW());

-- Enable RLS
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own tokens
CREATE POLICY "Users can view their own api tokens" ON public.api_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own api tokens" ON public.api_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own api tokens" ON public.api_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own api tokens" ON public.api_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.api_tokens TO authenticated;
GRANT ALL ON public.api_tokens TO service_role;
