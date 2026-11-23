-- Migration 029: Add indexes for hot query paths
--
-- This migration adds indexes for the query paths identified as slow via
-- queryOptimizer.getSlowQueries() / analyzeQueries() and application logs.
-- Each index below documents the target query it is meant to accelerate.
--
-- The migration is idempotent: every statement uses CREATE INDEX IF NOT EXISTS,
-- so it is safe to run multiple times and on databases where some indexes may
-- already exist.

-- 1. transactions(user_address)
-- Target query: lookups of a user's transaction history, e.g.
--   SELECT * FROM transactions WHERE user_address = $1 ORDER BY timestamp DESC;
-- Speeds up per-user transaction listing and balance/history endpoints.
CREATE INDEX IF NOT EXISTS idx_transactions_user_address
    ON transactions (user_address);

-- 2. transactions(payout_order_id)
-- Target query: resolving transactions associated with a payout order, e.g.
--   SELECT * FROM transactions WHERE payout_order_id = $1;
-- Used by payout reconciliation and order detail views.
CREATE INDEX IF NOT EXISTS idx_transactions_payout_order_id
    ON transactions (payout_order_id);

-- 3. transactions(status)
-- Target query: filtering transactions by processing state, e.g.
--   SELECT * FROM transactions WHERE status = $1;
-- Used by background workers scanning pending/failed transactions.
CREATE INDEX IF NOT EXISTS idx_transactions_status
    ON transactions (status);

-- 4. transactions(timestamp DESC)
-- Target query: recent activity feeds and paginated history, e.g.
--   SELECT * FROM transactions ORDER BY timestamp DESC LIMIT $1 OFFSET $2;
-- Supports efficient descending scans for the latest transactions.
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp_desc
    ON transactions (timestamp DESC);

-- 5. audit_log(user_address)
-- Target query: retrieving audit trail entries for a given user, e.g.
--   SELECT * FROM audit_log WHERE user_address = $1 ORDER BY created_at DESC;
-- Accelerates per-user audit lookups flagged in slow query logs.
CREATE INDEX IF NOT EXISTS idx_audit_log_user_address
    ON audit_log (user_address);

-- 6. audit_log(created_at DESC)
-- Target query: recent audit entries, e.g.
--   SELECT * FROM audit_log ORDER BY created_at DESC LIMIT $1;
-- Supports time-ordered audit log pagination.
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at_desc
    ON audit_log (created_at DESC);

-- 7. api_keys(key_hash)
-- Target query: authentication lookup by hashed API key, e.g.
--   SELECT * FROM api_keys WHERE key_hash = $1;
-- Ensures constant-time-ish indexed lookups on the auth hot path.
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash
    ON api_keys (key_hash);

-- 8. api_keys(user_address)
-- Target query: listing API keys owned by a user, e.g.
--   SELECT * FROM api_keys WHERE user_address = $1;
-- Speeds up key management endpoints.
CREATE INDEX IF NOT EXISTS idx_api_keys_user_address
    ON api_keys (user_address);