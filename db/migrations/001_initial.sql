CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS credential_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  tenant_id text NOT NULL,
  client_id text NOT NULL,
  encrypted_client_secret text NOT NULL,
  graph_base_url text NOT NULL DEFAULT 'https://graph.microsoft.com/v1.0',
  authority_host text NOT NULL DEFAULT 'https://login.microsoftonline.com',
  status text NOT NULL DEFAULT 'draft',
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mailbox_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email_address text NOT NULL UNIQUE,
  credential_id uuid NOT NULL REFERENCES credential_vault(id) ON DELETE RESTRICT,
  monitor_enabled boolean NOT NULL DEFAULT true,
  folder text NOT NULL DEFAULT 'Inbox',
  polling_minutes integer NOT NULL DEFAULT 5 CHECK (polling_minutes BETWEEN 1 AND 1440),
  last_delta_link text,
  last_checked_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outlook_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT 'preset0',
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  priority integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  match_mode text NOT NULL DEFAULT 'all' CHECK (match_mode IN ('all', 'any')),
  sender_contains text NOT NULL DEFAULT '',
  subject_contains text NOT NULL DEFAULT '',
  body_contains text NOT NULL DEFAULT '',
  has_attachments boolean,
  category_id uuid NOT NULL REFERENCES outlook_categories(id) ON DELETE RESTRICT,
  stop_processing boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classified_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id uuid NOT NULL REFERENCES mailbox_connections(id) ON DELETE CASCADE,
  graph_message_id text NOT NULL,
  internet_message_id text,
  subject text NOT NULL DEFAULT '',
  sender text NOT NULL DEFAULT '',
  matched_rule_ids uuid[] NOT NULL DEFAULT '{}',
  applied_category_names text[] NOT NULL DEFAULT '{}',
  status text NOT NULL,
  error_message text,
  classified_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mailbox_id, graph_message_id)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor text NOT NULL DEFAULT 'system',
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_name text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rules_priority ON classification_rules (is_active, priority);
CREATE INDEX IF NOT EXISTS idx_messages_mailbox ON classified_messages (mailbox_id, classified_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events (created_at DESC);
