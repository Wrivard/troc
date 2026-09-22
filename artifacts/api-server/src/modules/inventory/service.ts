import { createHash, randomUUID } from "node:crypto";
import { authorize, type Principal } from "../auth/permissions";
import type { Sql } from "../commerce/data";
import type { TransactionStore } from "../commerce/checkout";
import { DomainError } from "../shared/domain";
import { cents, csvRecords, mappingFor, parseCsv, type Field } from "./csv";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function uuid(v: unknown): string {
  if (typeof v !== "string" || !uuidPattern.test(v))
    throw new DomainError("invalid_id");
  return v.toLowerCase();
}
function key(v: unknown): string {
  if (typeof v !== "string" || !/^[\w-]{8,100}$/.test(v))
    throw new DomainError("invalid_request_key");
  return v;
}
function string(v: unknown, max = 100): string {
  if (typeof v !== "string" || v.length > max)
    throw new DomainError("invalid_inventory");
  return v.trim();
}
function integer(v: unknown, min = 0, max = 1000000): number {
  if (typeof v !== "number" || !Number.isSafeInteger(v) || v < min || v > max)
    throw new DomainError("invalid_inventory");
  return v;
}
type PreviewRow = {
  row: number;
  status: "matched" | "unmatched" | "ambiguous" | "invalid" | "duplicate";
  reason: string;
  variantId: string | null;
  candidates: string[];
  input: Record<Field, string>;
  priceCents: number;
  quantity: number;
};
type ImportRow = {
  id: string;
  seller_id: string;
  rows: PreviewRow[];
  summary: Record<string, number>;
  status: string;
  request_hash: string;
  published_count: number;
  created_at: Date;
};
export class InventoryService {
  async photoThreshold(db: Sql) {
    const row = (
      await db.query<{ value: { photoThresholdCents: number } }>(
        "SELECT value FROM troc.platform_settings WHERE key='commerce'",
      )
    ).rows[0];
    return integer(row?.value.photoThresholdCents, 1, 100000000);
  }
  constructor(
    private db: Sql,
    private store: TransactionStore,
  ) {}
  async access(db: Sql, p: Principal, seller: string, lock = false) {
    authorize(p, "inventory:write", uuid(seller));
    const a = (
      await db.query<{ demo_batch_id: string | null }>(
        `SELECT demo_batch_id FROM troc.seller_accounts WHERE id=$1 AND status='active' ${lock ? "FOR UPDATE" : ""}`,
        [seller],
      )
    ).rows[0];
    if (!a) throw new DomainError("seller_unavailable", 403);
    return a;
  }
  async sellers(p: Principal) {
    return (
      await this.db.query<{ id: string; display_name: string }>(
        `SELECT s.id,s.display_name FROM troc.seller_accounts s JOIN troc.seller_members m ON m.seller_id=s.id WHERE m.user_id=$1 AND m.role IN ('owner','manager','inventory') AND s.status='active' ORDER BY s.display_name`,
        [p.userId],
      )
    ).rows;
  }
  async sources() {
    return (
      await this.db.query(
        "SELECT id,label FROM troc.inventory_sources ORDER BY id",
      )
    ).rows;
  }
  async catalog(p: Principal, seller: string, q: string) {
    await this.access(this.db, p, seller);
    q = string(q, 100);
    if (q.length < 2) return [];
    return (
      await this.db.query(
        `SELECT v.id,p.name_en,p.name_fr,s.slug AS set,pr.collector_number AS number,pr.language,v.variant_key AS finish,p.product_type FROM troc.variants v JOIN troc.printings pr ON pr.id=v.printing_id JOIN troc.catalog_products p ON p.id=pr.product_id JOIN troc.set_releases s ON s.id=p.set_id WHERE (p.name_en ILIKE $1 ESCAPE '\\' OR p.name_fr ILIKE $1 ESCAPE '\\') AND p.product_type='raw_single' ORDER BY p.name_en,v.id LIMIT 40`,
        ["%" + q.replace(/[\\%_]/g, "\\$&") + "%"],
      )
    ).rows;
  }
  async list(
    p: Principal,
    seller: string,
    filter: Record<string, unknown> = {},
  ) {
    await this.access(this.db, p, seller);
    const q = string(filter.q ?? "", 100),
      source = string(filter.source ?? ""),
      status = string(filter.status ?? ""),
      sync = string(filter.sync ?? "");
    const after = filter.after ? uuid(filter.after) : null;
    const rows = (
      await this.db.query(
        `SELECT l.*,p.name_en,p.name_fr,pr.language,v.variant_key AS finish,pr.collector_number FROM troc.listings l JOIN troc.variants v ON v.id=l.variant_id JOIN troc.printings pr ON pr.id=v.printing_id JOIN troc.catalog_products p ON p.id=pr.product_id WHERE l.seller_id=$1 AND ($2::uuid IS NULL OR l.id>$2) AND ($3='' OR l.source_platform=$3) AND ($4='' OR l.status=$4) AND ($5='' OR l.sync_status=$5) AND ($6='' OR strpos(lower(coalesce(l.seller_sku,'')||' '||p.name_en||' '||p.name_fr),lower($6))>0) ORDER BY l.id LIMIT 51`,
        [seller, after, source, status, sync, q],
      )
    ).rows;
    const more = rows.length > 50;
    return {
      rows: rows.slice(0, 50),
      next: more ? (rows[49] as { id: string }).id : null,
    };
  }
  async mappings(p: Principal, seller: string) {
    await this.access(this.db, p, seller);
    return (
      await this.db.query(
        "SELECT name,mapping FROM troc.inventory_mappings WHERE seller_id=$1 ORDER BY name",
        [seller],
      )
    ).rows;
  }
  async preview(
    p: Principal,
    seller: string,
    input: {
      csv: string;
      mapping?: unknown;
      mappingName?: unknown;
      source?: unknown;
      requestKey?: unknown;
    },
  ) {
    const requestKey = key(input.requestKey),
      source = string(input.source ?? "csv");
    const data = parseCsv(input.csv),
      mapping = mappingFor(data[0], input.mapping);
    const records = csvRecords(data, mapping);
    const hash = createHash("sha256")
      .update(JSON.stringify({ csv: input.csv, mapping, source }))
      .digest("hex");
    return this.store.transaction(async (tx) => {
      await this.access(tx, p, seller, true);
      if (
        !(
          await tx.query("SELECT id FROM troc.inventory_sources WHERE id=$1", [
            source,
          ])
        ).rows.length
      )
        throw new DomainError("invalid_source");
      const previous = (
        await tx.query<ImportRow>(
          "SELECT * FROM troc.inventory_imports WHERE seller_id=$1 AND request_key=$2",
          [seller, requestKey],
        )
      ).rows[0];
      if (previous) {
        if (previous.request_hash !== hash)
          throw new DomainError("idempotency_conflict", 409);
        return { id: previous.id, summary: previous.summary };
      }
      const rows: PreviewRow[] = records.map((r, i) => {
        const row: PreviewRow = {
          row: i + 2,
          status: "matched",
          reason: "",
          variantId: null,
          candidates: [],
          input: r,
          priceCents: 0,
          quantity: 0,
        };
        try {
          row.priceCents = cents(r.price);
          if (!/^\d{1,7}$/.test(r.quantity))
            throw new DomainError("invalid_quantity");
          row.quantity = integer(Number(r.quantity));
          if (
            !r.seller_sku ||
            r.seller_sku.length > 100 ||
            [r.external_sku, r.external_listing_id].some((s) => s.length > 100)
          )
            throw new DomainError("invalid_sku");
          if (!["NM", "LP", "MP", "HP", "DMG"].includes(r.condition))
            throw new DomainError("invalid_condition");
          if (r.variant_id) r.variant_id = uuid(r.variant_id);
          else if (
            !(r.provider && r.external_catalog_id) &&
            !(r.name && r.set && r.number && r.language && r.finish)
          )
            throw new DomainError("canonical_fields_required");
        } catch (e) {
          row.status = "invalid";
          row.reason = e instanceof DomainError ? e.code : "invalid_row";
        }
        return row;
      });
      // Match batches against canonical records; never create catalog records from seller CSVs.
      for (let start = 0; start < rows.length; start += 500) {
        const batch = rows
          .slice(start, start + 500)
          .filter((r) => r.status === "matched");
        if (!batch.length) continue;
        const matches = (
          await tx.query<{ row: number; id: string }>(
            `WITH r AS (SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(row integer,variant_id uuid,provider text,external_catalog_id text,name text,"set" text,"number" text,language text,finish text)), matches AS (
     SELECT r.row,v.id FROM r JOIN troc.variants v ON v.id=r.variant_id
     UNION ALL SELECT r.row,m.variant_id FROM r JOIN troc.external_catalog_mappings m ON m.provider=r.provider AND m.external_id=r.external_catalog_id WHERE r.variant_id IS NULL AND r.provider<>''
     UNION ALL SELECT r.row,v.id FROM r JOIN troc.catalog_products p ON lower(p.name_en)=lower(r.name) OR lower(p.name_fr)=lower(r.name) JOIN troc.set_releases s ON s.id=p.set_id AND s.slug=r."set" JOIN troc.printings pr ON pr.product_id=p.id AND pr.collector_number=r."number" AND pr.language=r.language JOIN troc.variants v ON v.printing_id=pr.id AND v.variant_key=r.finish WHERE r.variant_id IS NULL AND r.provider=''
    ) SELECT DISTINCT m.row,m.id FROM matches m JOIN troc.variants v ON v.id=m.id JOIN troc.printings pr ON pr.id=v.printing_id JOIN troc.catalog_products p ON p.id=pr.product_id WHERE p.product_type='raw_single'`,
            [
              JSON.stringify(
                batch.map((r) => ({
                  ...r.input,
                  row: r.row,
                  variant_id: r.input.variant_id || null,
                })),
              ),
            ],
          )
        ).rows;
        const grouped = new Map<number, string[]>();
        for (const m of matches) {
          const ids = grouped.get(m.row) ?? [];
          ids.push(m.id);
          grouped.set(m.row, ids);
        }
        for (const row of batch) {
          const ids = grouped.get(row.row) ?? [];
          row.candidates = ids.slice(0, 10);
          row.variantId = ids.length === 1 ? ids[0] : null;
          row.status =
            ids.length === 1
              ? "matched"
              : ids.length
                ? "ambiguous"
                : "unmatched";
          row.reason = row.status === "matched" ? "" : row.status;
        }
      }
      const skuCounts = new Map<string, number>(),
        externalCounts = new Map<string, number>();
      for (const r of rows) {
        skuCounts.set(
          r.input.seller_sku,
          (skuCounts.get(r.input.seller_sku) ?? 0) + 1,
        );
        if (r.input.external_listing_id)
          externalCounts.set(
            r.input.external_listing_id,
            (externalCounts.get(r.input.external_listing_id) ?? 0) + 1,
          );
      }
      const existing = (
        await tx.query<{
          seller_sku: string | null;
          external_listing_id: string | null;
          source_platform: string;
        }>(
          "SELECT seller_sku,external_listing_id,source_platform FROM troc.listings WHERE seller_id=$1 AND (seller_sku=ANY($2::text[]) OR (source_platform=$3 AND external_listing_id=ANY($4::text[])))",
          [seller, [...skuCounts.keys()], source, [...externalCounts.keys()]],
        )
      ).rows;
      const skus = new Set(existing.map((r) => r.seller_sku));
      const external = new Set(
        existing
          .filter((r) => r.source_platform === source)
          .map((r) => r.external_listing_id),
      );
      for (const row of rows)
        if (
          row.status !== "invalid" &&
          ((skuCounts.get(row.input.seller_sku) ?? 0) > 1 ||
            skus.has(row.input.seller_sku) ||
            (row.input.external_listing_id &&
              ((externalCounts.get(row.input.external_listing_id) ?? 0) > 1 ||
                external.has(row.input.external_listing_id))))
        ) {
          row.status = "duplicate";
          row.reason = "duplicate_inventory_identity";
        }
      const summary: Record<string, number> = {
        matched: 0,
        unmatched: 0,
        ambiguous: 0,
        invalid: 0,
        duplicate: 0,
        total: rows.length,
      };
      for (const row of rows) summary[row.status]++;
      const id = randomUUID();
      await tx.query(
        "INSERT INTO troc.inventory_imports(id,seller_id,actor_id,request_key,request_hash,rows,summary) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          id,
          seller,
          p.userId,
          requestKey,
          hash,
          JSON.stringify(rows.map((r) => ({ ...r, source }))),
          JSON.stringify(summary),
        ],
      );
      if (input.mappingName) {
        const name = string(input.mappingName, 60);
        if (!name) throw new DomainError("invalid_mapping");
        await tx.query(
          "INSERT INTO troc.inventory_mappings(seller_id,name,mapping) VALUES($1,$2,$3) ON CONFLICT(seller_id,name) DO UPDATE SET mapping=EXCLUDED.mapping,updated_at=now()",
          [seller, name, JSON.stringify(mapping)],
        );
      }
      return { id, summary };
    });
  }
  async review(p: Principal, seller: string, id: string, page = 0) {
    await this.access(this.db, p, seller);
    integer(page, 0, 400);
    const record = (
      await this.db.query<ImportRow>(
        "SELECT * FROM troc.inventory_imports WHERE seller_id=$1 AND id=$2",
        [seller, uuid(id)],
      )
    ).rows[0];
    if (!record) throw new DomainError("not_found", 404);
    return {
      id: record.id,
      status: record.status,
      summary: record.summary,
      rows: record.rows.slice(page * 50, (page + 1) * 50),
      next: (page + 1) * 50 < record.rows.length ? page + 1 : null,
    };
  }
  async publish(p: Principal, seller: string, id: string) {
    return this.store.transaction(async (tx) => {
      const account = await this.access(tx, p, seller, true);
      const record = (
        await tx.query<ImportRow>(
          "SELECT * FROM troc.inventory_imports WHERE seller_id=$1 AND id=$2 FOR UPDATE",
          [seller, uuid(id)],
        )
      ).rows[0];
      if (!record) throw new DomainError("not_found", 404);
      if (record.status === "published")
        return { count: record.published_count };
      if (record.rows.some((r) => r.status !== "matched"))
        throw new DomainError("import_needs_review", 409);
      if (Date.now() - new Date(record.created_at).getTime() > 86400000)
        throw new DomainError("preview_expired", 409);
      const photoThreshold = await this.photoThreshold(tx);
      try {
        for (let i = 0; i < record.rows.length; i += 500)
          await tx.query(
            `INSERT INTO troc.listings(seller_id,variant_id,condition,unit_price_cents,quantity,status,seller_sku,external_sku,external_listing_id,source_platform,demo_batch_id)
    SELECT $1,r."variantId",r.input->>'condition',r."priceCents",r.quantity,CASE WHEN r."priceCents">=$4 THEN 'draft' WHEN r.quantity=0 THEN 'sold_out' ELSE 'active' END,r.input->>'seller_sku',nullif(r.input->>'external_sku',''),nullif(r.input->>'external_listing_id',''),r.source,$3
    FROM jsonb_to_recordset($2::jsonb) AS r("variantId" uuid,"priceCents" integer,quantity integer,input jsonb,source text)`,
            [
              seller,
              JSON.stringify(record.rows.slice(i, i + 500)),
              account.demo_batch_id,
              photoThreshold,
            ],
          );
      } catch (e) {
        if ((e as { code?: string }).code === "23505")
          throw new DomainError("inventory_changed_repreview", 409);
        throw e;
      }
      await tx.query(
        "UPDATE troc.inventory_imports SET status='published',published_at=now(),published_count=$2 WHERE id=$1",
        [id, record.rows.length],
      );
      await tx.query(
        "INSERT INTO troc.audit_events(actor_id,action,entity_type,entity_id,metadata) VALUES($1,'inventory.import_published','inventory_import',$2,$3)",
        [
          p.userId,
          id,
          JSON.stringify({ count: record.rows.length, sellerId: seller }),
        ],
      );
      return { count: record.rows.length };
    });
  }
  async create(p: Principal, seller: string, value: Record<string, unknown>) {
    // Manual publishing reuses validation, canonical matching, duplicate review and idempotency.
    const values = [
      uuid(value.variantId),
      string(value.condition),
      String(integer(value.priceCents, 1, 100000000) / 100),
      String(integer(value.quantity)),
      string(value.sellerSku),
    ];
    const csv =
      "variant_id,condition,price,quantity,seller_sku\n" +
      values.map((v) => '"' + v.replace(/"/g, '""') + '"').join(",");
    const preview = await this.preview(p, seller, {
      csv,
      source: "manual",
      requestKey: value.requestKey,
    });
    await this.publish(p, seller, preview.id);
    return preview;
  }
  async bulk(p: Principal, seller: string, changes: unknown) {
    if (!Array.isArray(changes) || !changes.length || changes.length > 100)
      throw new DomainError("invalid_bulk");
    const updates = changes
      .map((v) => {
        if (!v || typeof v !== "object") throw new DomainError("invalid_bulk");
        const r = v as Record<string, unknown>;
        return {
          id: uuid(r.id),
          version: integer(r.version, 1, 2147483647),
          quantity: r.quantity === undefined ? undefined : integer(r.quantity),
          price:
            r.priceCents === undefined
              ? undefined
              : integer(r.priceCents, 1, 100000000),
          status: r.status === undefined ? undefined : string(r.status),
        };
      })
      .sort((a, b) => a.id.localeCompare(b.id));
    if (
      new Set(updates.map((v) => v.id)).size !== updates.length ||
      updates.some(
        (v) =>
          v.status !== undefined &&
          !["active", "paused", "archived"].includes(v.status),
      )
    )
      throw new DomainError("invalid_bulk");
    return this.store.transaction(async (tx) => {
      await this.access(tx, p, seller, true);
      const photoThreshold = await this.photoThreshold(tx);
      for (const u of updates) {
        const current = (
          await tx.query<{
            quantity: number;
            inventory_version: number;
            unit_price_cents: number;
            status: string;
            sale_cents: number | null;
            has_photos: boolean;
          }>(
            "SELECT quantity,inventory_version,unit_price_cents,status,sale_cents,EXISTS(SELECT 1 FROM troc.listing_photos ph WHERE ph.listing_id=l.id) AS has_photos FROM troc.listings l WHERE seller_id=$1 AND id=$2 FOR UPDATE",
            [seller, u.id],
          )
        ).rows[0];
        if (!current) throw new DomainError("not_found", 404);
        if (current.inventory_version !== u.version)
          throw new DomainError("inventory_changed", 409);
        const reserved = (
          await tx.query<{ quantity: string }>(
            "SELECT coalesce(sum(quantity),0) AS quantity FROM troc.inventory_reservations WHERE listing_id=$1 AND state='reserved' AND expires_at>now()",
            [u.id],
          )
        ).rows[0];
        // A pending checkout owns a stock snapshot; sellers retry after it finishes/expires.
        if (Number(reserved.quantity) > 0)
          throw new DomainError("inventory_reserved", 409);
        const quantity = u.quantity ?? current.quantity;
        let status = u.status ?? current.status;
        if (quantity === 0 && status === "active") status = "sold_out";
        if (quantity > 0 && status === "sold_out") status = "active";
        const price = u.price ?? current.unit_price_cents;
        if (current.sale_cents !== null && price < current.sale_cents)
          throw new DomainError("price_below_sale", 409);
        if (
          status === "active" &&
          price >= photoThreshold &&
          !current.has_photos
        )
          throw new DomainError("listing_photos_required", 409);
        await tx.query(
          "UPDATE troc.listings SET quantity=$3,unit_price_cents=$4,status=$5 WHERE seller_id=$1 AND id=$2",
          [seller, u.id, quantity, u.price ?? current.unit_price_cents, status],
        );
        await tx.query(
          "INSERT INTO troc.audit_events(actor_id,action,entity_type,entity_id) VALUES($1,'inventory.updated','listing',$2)",
          [p.userId, u.id],
        );
      }
      return { count: updates.length };
    });
  }
}
