
import{PGlite}from"@electric-sql/pglite";
const db=new PGlite(".local/test-accounts/database");
try {await db.transaction(async tx=>{
 const id="00000000-0000-4000-9000-000000003000";
 const owned=await tx.query("SELECT so.id FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id JOIN troc.demo_batches b ON b.id=mo.demo_batch_id WHERE so.id=$1 AND b.seed_key='local-workspace-ui-v1'",[id]);
 if(!owned.rows.length)throw Error("Expected fictional fixture missing; no changes made");
 const removed=await tx.query("DELETE FROM troc.order_messages WHERE seller_order_id=$1 AND author='seller' AND body='Local UI test draft' RETURNING id",[id]);
 console.log("Removed only generated UI-test replies:",removed.rows.length);
 await tx.query("INSERT INTO troc.order_messages(id,seller_order_id,actor_id,author,body,created_at) VALUES('00000000-0000-4000-9000-000000008001',$1,'00000000-0000-4000-8000-000000000002','seller','Thanks for checking! Your cards are packed securely. I will add tracking to this order once they are on their way.',now()) ON CONFLICT(id) DO NOTHING",[id]);
 });}finally{await db.close()}
