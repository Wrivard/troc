import { PromotionPublication } from "../modules/seller-platform/promotion-publication";
import { uuid } from "../modules/seller-platform/domain";
import { TeamInvitations } from "../modules/seller-platform/team-invitations";
import { sellerAnalyticsExport } from "../modules/seller-platform/analytics-export";
import {sellerAnalyticsProducts,sellerAnalyticsBreakdown} from "../modules/seller-platform/analytics-breakdown";
import {sellerAnalyticsSummary} from "../modules/seller-platform/analytics-summary";
import { sellerConversationList } from "../modules/seller-platform/conversation-list";
import { sellerOrderSummary } from "../modules/seller-platform/order-summary";
import { sellerOrderList } from "../modules/seller-platform/order-list";
import {StoreEnquiries} from "../modules/seller-platform/enquiries";
import { sellerOperations, sellerConversationContext } from "../modules/seller-platform/operations";
import { Router, type Request, type Response } from "express";
import { requestRateLimit } from "../modules/security/rate-limit";
import type { Principal } from "../modules/auth/permissions";
import type { Sql } from "../modules/commerce/data";
import type { TransactionStore } from "../modules/commerce/checkout";
import { SellerPlatformService } from "../modules/seller-platform/service";
export function sellerPlatformRouter(
  db: Sql,
  store: TransactionStore,
  principal: (req: Request, res: Response) => Promise<Principal>,
) {
  const router = Router(),
    service = new SellerPlatformService(db, store);
  router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  router.use(
    ["/seller/applications", "/seller/platform", "/seller/invitations", "/admin/seller-applications"],
    requestRateLimit({namespace:"seller-platform",windowMs:60000,limit:60}),
  );
  const publication = new PromotionPublication(db,store,service);
  router.get("/seller/platform/:seller/promotions",async(req,res)=>{
    res.setHeader("Cache-Control","no-store");
    res.json(await publication.read(await principal(req,res),req.params.seller));
  });
  router.post("/seller/platform/:seller/promotions",async(req,res)=>{
    res.setHeader("Cache-Control","no-store");
    res.json(await publication.command(await principal(req,res),req.params.seller,req.body??{}));
  });
  const invitations = new TeamInvitations(store,service);
  router.get("/seller/invitations",async(req,res)=>res.json(await invitations.list(await principal(req,res),null,req.query)));
  router.get("/seller/platform/:seller/invitations",async(req,res)=>res.json(await invitations.list(await principal(req,res),req.params.seller,req.query)));
  router.post("/seller/platform/:seller/invitations",async(req,res)=>res.json(await invitations.create(await principal(req,res),req.params.seller,req.body??{})));
  for(const action of ["accept","decline","revoke"] as const)router.post("/seller/platform/:seller/invitations/:id/"+action,async(req,res)=>res.json(await invitations.resolve(await principal(req,res),uuid(req.params.seller),uuid(req.params.id),action)));
  // POST /seller/applications remains in foundation.ts; integration replaces its service only.
  router.get("/seller/applications", async (req, res) =>
    res.json(await service.applications(await principal(req, res))),
  );
  router.get("/admin/seller-applications", async (req, res) =>
    res.json(
      await service.applications(
        await principal(req, res),
        true,
        Number(req.query.page ?? 0),
      ),
    ),
  );
  router.post("/admin/seller-applications/:id/review", async (req, res) =>
    res.json(
      await service.review(
        await principal(req, res),
        req.params.id,
        req.body ?? {},
      ),
    ),
  );
  router.get("/seller/platform/sellers", async (req, res) =>
    res.json(
      await service.sellers(
        await principal(req, res),
        Number(req.query.page ?? 0),
      ),
    ),
  );
  router.get("/seller/platform/:seller/dashboard", async (req, res) =>
    res.json(
      await service.dashboard(await principal(req, res), req.params.seller),
    ),
  );
  router.get("/seller/platform/:seller/team", async (req, res) =>
    res.json(
      await service.team(
        await principal(req, res),
        req.params.seller,
        Number(req.query.page ?? 0),
      ),
    ),
  );
  router.post("/seller/platform/:seller/team", async (req, res) =>
    res.json(
      await service.member(
        await principal(req, res),
        req.params.seller,
        req.body ?? {},
      ),
    ),
  );
  router.get("/seller/platform/:seller/settings", async (req, res) =>
    res.json(
      await service.settings(await principal(req, res), req.params.seller),
    ),
  );
  router.post("/seller/platform/:seller/settings", async (req, res) =>
    res.json(
      await service.saveSettings(
        await principal(req, res),
        req.params.seller,
        req.body ?? {},
      ),
    ),
  );
  router.get("/seller/platform/:seller/promotion-drafts",async(req,res)=>res.json(await service.promotionDrafts(await principal(req,res),req.params.seller)));
  router.post("/seller/platform/:seller/promotion-drafts",async(req,res)=>res.json(await service.savePromotionDrafts(await principal(req,res),req.params.seller,req.body)));
  router.get("/seller/platform/:seller/storefront", async(req,res)=>res.json(await service.storefront(await principal(req,res),req.params.seller)));
  router.post("/seller/platform/:seller/storefront", async(req,res)=>res.json(await service.saveStorefront(await principal(req,res),req.params.seller,req.body)));
  router.get("/seller/platform/:seller/analytics-export",async(req,res)=>res.json(await sellerAnalyticsExport(db,service,await principal(req,res),req.params.seller,req.query)));
  router.get("/seller/platform/:seller/analytics-products",async(req,res)=>res.json(await sellerAnalyticsProducts(db,service,await principal(req,res),req.params.seller,req.query)));
  router.get("/seller/platform/:seller/analytics-breakdown",async(req,res)=>res.json(await sellerAnalyticsBreakdown(db,service,await principal(req,res),req.params.seller,req.query)));
  router.get("/seller/platform/:seller/analytics-summary",async(req,res)=>res.json(await sellerAnalyticsSummary(db,service,await principal(req,res),req.params.seller,req.query)));
  router.get("/seller/platform/:seller/conversations/:id", async (req,res) => res.json(await sellerConversationContext(db,service,await principal(req,res),req.params.seller,req.params.id)));
  router.get("/seller/platform/:seller/conversations", async (req,res) => res.json(await sellerConversationList(db,service,await principal(req,res),req.params.seller,req.query)));
  router.get("/seller/platform/:seller/order-summary", async (req, res) => res.json(await sellerOrderSummary(db, service, await principal(req, res), req.params.seller, req.query)));
  router.get("/seller/platform/:seller/order-list", async (req, res) => res.json(await sellerOrderList(db, service, await principal(req, res), req.params.seller, req.query)));
  router.get("/seller/platform/:seller/operations", async (req,res) => res.json(await sellerOperations(db,service,await principal(req,res),req.params.seller)));

  const enquiries=new StoreEnquiries(db,store,service);
  router.get("/seller/platform/:seller/enquiries",async(req,res)=>res.json(await (req.query.page==="true"?enquiries.listPage(await principal(req,res),req.params.seller,typeof req.query.before==="string"?req.query.before:undefined):enquiries.list(await principal(req,res),req.params.seller))));
  router.post("/seller/platform/:seller/enquiries",async(req,res)=>res.json(await enquiries.create(await principal(req,res),req.params.seller,req.body||{})));
  router.get("/seller/platform/:seller/enquiries/:id",async(req,res)=>res.json(await enquiries.read(await principal(req,res),req.params.seller,req.params.id,typeof req.query.before==="string"?req.query.before:undefined)));
  router.post("/seller/platform/:seller/enquiries/:id",async(req,res)=>res.json(await enquiries.reply(await principal(req,res),req.params.seller,req.params.id,req.body||{})));
  router.post("/seller/platform/:seller/enquiries/:id/read",async(req,res)=>res.json(await enquiries.markRead(await principal(req,res),req.params.seller,req.params.id)));
  router.post("/seller/platform/:seller/enquiries/:id/reports",async(req,res)=>res.json(await enquiries.report(await principal(req,res),req.params.seller,req.params.id,req.body)));
  router.get("/seller/admin/enquiry-reports",async(req,res)=>res.json(await enquiries.reports(await principal(req,res),typeof req.query.before==="string"?req.query.before:undefined)));
  router.post("/seller/admin/enquiry-reports/:id/review",async(req,res)=>res.json(await enquiries.reviewReport(await principal(req,res),req.params.id,req.body)));
  router.post("/seller/platform/:seller/enquiries/:id/block",async(req,res)=>res.json(await enquiries.setBlocked(await principal(req,res),req.params.seller,req.params.id,req.body)));
  return router;
}


