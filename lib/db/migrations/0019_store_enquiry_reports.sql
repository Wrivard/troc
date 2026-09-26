-- Local candidate: immutable reports, private through service authorization.
CREATE TABLE troc.store_enquiry_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 message_id uuid NOT NULL REFERENCES troc.store_enquiry_messages(id),
 reporter_id uuid NOT NULL REFERENCES troc.users(id),
 reason text NOT NULL CHECK(reason IN ('spam','harassment','fraud','other')),
 details text NOT NULL DEFAULT '' CHECK(length(details)<=1000),
 request_key uuid NOT NULL,
 state text NOT NULL DEFAULT 'open' CHECK(state IN ('open','resolved','dismissed')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(reporter_id,request_key),UNIQUE(reporter_id,message_id)
);
CREATE INDEX store_enquiry_reports_review ON troc.store_enquiry_reports(created_at,id);
ALTER TABLE troc.store_enquiry_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY backend_reports ON troc.store_enquiry_reports TO troc_backend USING(true) WITH CHECK(true);
REVOKE ALL ON troc.store_enquiry_reports FROM PUBLIC;
GRANT SELECT,INSERT ON troc.store_enquiry_reports TO troc_backend;
-- No public client access, no automatic block/suspension and no external support delivery.
