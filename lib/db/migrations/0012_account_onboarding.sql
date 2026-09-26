SET search_path TO troc, public;
CREATE TABLE onboarding_drafts (
 id uuid PRIMARY KEY, secret_hash text NOT NULL, revision integer NOT NULL DEFAULT 1,
 awaiting_email boolean NOT NULL DEFAULT false, payload jsonb NOT NULL, ready boolean NOT NULL DEFAULT false,
 owner_id uuid REFERENCES users(id), profile_revision integer, completed_by uuid REFERENCES users(id),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX onboarding_drafts_expiry ON onboarding_drafts(expires_at);
CREATE TABLE onboarding_profiles (
 user_id uuid PRIMARY KEY REFERENCES users(id), revision integer NOT NULL DEFAULT 1,
 payload jsonb NOT NULL, status text NOT NULL DEFAULT 'waitlisted' CHECK(status IN ('waitlisted','withdrawn')),
 email_verified_at timestamptz NOT NULL DEFAULT now(),
 consent_version text NOT NULL, consented_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE onboarding_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON onboarding_drafts TO troc_backend;
GRANT SELECT,INSERT,UPDATE ON onboarding_profiles TO troc_backend;
CREATE POLICY onboarding_drafts_backend ON onboarding_drafts TO troc_backend USING(true) WITH CHECK(true);
CREATE POLICY onboarding_profiles_backend ON onboarding_profiles TO troc_backend USING(true) WITH CHECK(true);

GRANT UPDATE(display_name,updated_at) ON user_profiles TO troc_backend;
