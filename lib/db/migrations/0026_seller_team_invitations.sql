-- Private in-app invitations; no membership or message is created by this migration.
CREATE TABLE troc.seller_team_invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 seller_id uuid NOT NULL REFERENCES troc.seller_accounts(id) ON DELETE RESTRICT,
 recipient_user_id uuid NOT NULL REFERENCES troc.users(id) ON DELETE RESTRICT,
 invited_by uuid NOT NULL REFERENCES troc.users(id) ON DELETE RESTRICT,
 role text NOT NULL CHECK(role IN ('manager','inventory','fulfillment','customer_service')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined','revoked','expired')),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
 resolved_at timestamptz,
 CHECK(recipient_user_id <> invited_by),
 CHECK(expires_at > created_at),
 CHECK((status='pending' AND resolved_at IS NULL) OR (status<>'pending' AND resolved_at IS NOT NULL))
);
CREATE UNIQUE INDEX seller_team_invitation_pending ON troc.seller_team_invitations(seller_id,recipient_user_id) WHERE status='pending';
CREATE INDEX seller_team_invitation_recipient ON troc.seller_team_invitations(recipient_user_id,created_at DESC,id DESC);
CREATE INDEX seller_team_invitation_seller ON troc.seller_team_invitations(seller_id,created_at DESC,id DESC);
ALTER TABLE troc.seller_team_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON troc.seller_team_invitations FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON troc.seller_team_invitations TO troc_backend;
CREATE POLICY backend_team_invitations ON troc.seller_team_invitations FOR ALL TO troc_backend USING(true) WITH CHECK(true);
