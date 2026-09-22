-- Independent of 0009. Real leads stay in the original, non-demo tables.
SET search_path TO troc, public;
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['buyer_waitlist','founding_seller_leads'] LOOP
  EXECUTE format('ALTER TABLE %I ADD COLUMN details jsonb NOT NULL DEFAULT ''{}'', ADD COLUMN acquisition jsonb NOT NULL DEFAULT ''{}'', ADD COLUMN cohort text NOT NULL DEFAULT ''unassigned'' CHECK(cohort IN (''unassigned'',''internal'',''founding_sellers'',''private_alpha'',''collector_closed_beta'',''public'')), ADD COLUMN lead_status text NOT NULL DEFAULT ''new'' CHECK(lead_status IN (''new'',''reviewing'',''contacted'',''waitlisted'')), ADD COLUMN withdrawal_hash text UNIQUE, ADD COLUMN revision integer NOT NULL DEFAULT 1',tab);
  -- Legacy duplicates are retained. Capture serializes normalized email checks.
  EXECUTE format('CREATE INDEX ON %I (lower(btrim(email)))',tab);
  EXECUTE format('CREATE INDEX ON %I (cohort,lead_status,created_at DESC,id)',tab);
  EXECUTE format('CREATE INDEX ON %I USING gin(details)',tab);
  EXECUTE format('GRANT SELECT,INSERT ON %I TO troc_backend',tab);
  EXECUTE format('GRANT UPDATE(unsubscribed_at,cohort,lead_status,revision) ON %I TO troc_backend',tab);
  EXECUTE format('CREATE POLICY prelaunch_backend ON %I TO troc_backend USING(true) WITH CHECK(true)',tab);
 END LOOP;
END $$;
CREATE TABLE prelaunch_referrals (
 code text PRIMARY KEY CHECK(code ~ '^[a-zA-Z0-9_-]{8,64}$'),
 active boolean NOT NULL DEFAULT true,
 collector_lead_id uuid REFERENCES buyer_waitlist(id),
 seller_lead_id uuid REFERENCES founding_seller_leads(id),
 CHECK (num_nonnulls(collector_lead_id,seller_lead_id)<=1),
 created_by uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE prelaunch_sessions (
 id uuid PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('collector','seller')),
 source text NOT NULL CHECK(source IN ('direct','newsletter','social','event','partner')),
 referral_code text REFERENCES prelaunch_referrals(code), analytics_consent boolean NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL
);
CREATE TABLE prelaunch_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid NOT NULL REFERENCES prelaunch_sessions(id),
 name text NOT NULL CHECK(name IN ('landing_visit','cta','form_start','completion','referral')),
 provenance text NOT NULL CHECK(provenance IN ('client_observed','server_recorded')),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(session_id,name),
 CHECK ((name IN ('completion','referral')) = (provenance='server_recorded'))
);
CREATE TABLE prelaunch_rate_windows (
 key text PRIMARY KEY, hits integer NOT NULL, expires_at timestamptz NOT NULL
);
CREATE INDEX prelaunch_sessions_expiry ON prelaunch_sessions(expires_at);
CREATE INDEX prelaunch_rate_expiry ON prelaunch_rate_windows(expires_at);
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['prelaunch_referrals','prelaunch_sessions','prelaunch_events','prelaunch_rate_windows'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',tab);
  EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',tab);
  EXECUTE format('GRANT SELECT,INSERT ON %I TO troc_backend',tab);
  EXECUTE format('CREATE POLICY prelaunch_backend ON %I TO troc_backend USING(true) WITH CHECK(true)',tab);
 END LOOP;
END $$;
GRANT UPDATE(active) ON prelaunch_referrals TO troc_backend;
GRANT UPDATE(hits) ON prelaunch_rate_windows TO troc_backend;
