import { randomUUID } from "node:crypto";
import type { CatalogImportProvider, ImportRecord } from "@workspace/catalog";
import { authorize, type Principal } from "../auth/permissions";
import { DomainError } from "../shared/domain";
export function validateImport(value: unknown): ImportRecord {
  const r = value as ImportRecord;
  const pair = (v: unknown) =>
    !!v &&
    typeof v === "object" &&
    ["en", "fr"].every(
      (k) =>
        typeof (v as Record<string, unknown>)[k] === "string" &&
        String((v as Record<string, unknown>)[k]).trim().length > 0 &&
        String((v as Record<string, unknown>)[k]).length <= 200,
    );
  if (
    !r ||
    typeof r.externalId !== "string" ||
    r.externalId.length > 300 ||
    !r.externalId ||
    ![r.game, r.set, r.product].every(
      (x) =>
        x &&
        typeof x.key === "string" &&
        x.key.length > 0 &&
        x.key.length <= 200 &&
        pair(x.name),
    ) ||
    !r.printing ||
    !r.variant
  )
    throw new DomainError("invalid_record");
  if (
    !["raw_single", "graded_card", "sealed"].includes(r.product.type) ||
    !["en", "ja"].includes(r.printing.language) ||
    !Array.isArray(r.product.aliases) ||
    r.product.aliases.length > 30 ||
    !r.product.aliases.every((a) => typeof a === "string" && a.length <= 200)
  )
    throw new DomainError("invalid_record");
  if (
    ![
      r.printing.key,
      r.printing.number,
      r.printing.rarity,
      r.printing.artist,
      r.variant.key,
    ].every((v) => typeof v === "string" && v.length <= 200) ||
    !r.printing.key ||
    !r.variant.key ||
    !r.variant.attributes ||
    Array.isArray(r.variant.attributes) ||
    Object.keys(r.variant.attributes).length > 30 ||
    !Object.entries(r.variant.attributes).every(
      ([k, v]) => k.length <= 100 && typeof v === "string" && v.length <= 200,
    )
  )
    throw new DomainError("invalid_record");
  if (
    r.set.releasedOn !== null &&
    !/^\d{4}-\d{2}-\d{2}$/.test(r.set.releasedOn)
  )
    throw new DomainError("invalid_record");
  if (r.image) {
    try {
      const url = new URL(r.image.url);
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        !r.image.license
      )
        throw new Error();
    } catch {
      throw new DomainError("invalid_image_source");
    }
  }
  return r;
}
export interface CatalogSqlClient {
  query<T extends object = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: T[] }>;
}
type Connection = CatalogSqlClient;
const slug = (name: string) =>
  `${
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70) || "catalog"
  }-${randomUUID().slice(0, 8)}`;
async function mapped(
  db: Connection,
  provider: string,
  kind: string,
  key: string,
  create: () => Promise<string>,
) {
  const columns: Record<string, string> = {
    game: "game_id",
    set: "set_id",
    product: "product_id",
    printing: "printing_id",
  };
  const column = columns[kind];
  if (!column) throw new DomainError("invalid_entity");
  const found = await db.query(
    `SELECT ${column} AS id FROM troc.catalog_source_entities WHERE provider=$1 AND kind=$2 AND external_key=$3`,
    [provider, kind, key],
  );
  if (found.rows[0]) return String(found.rows[0].id);
  const id = await create();
  await db.query(
    `INSERT INTO troc.catalog_source_entities(provider,kind,external_key,${column}) VALUES($1,$2,$3,$4)`,
    [provider, kind, key, id],
  );
  return id;
}
async function importRecord(
  db: Connection,
  provider: string,
  r: ImportRecord,
  imagesApproved: boolean,
  demo: boolean,
) {
  if (r.image && !imagesApproved)
    throw new DomainError("image_license_unapproved");
  const game = await mapped(db, provider, "game", r.game.key, async () =>
    String(
      (
        await db.query(
          "INSERT INTO troc.games(slug,name_en,name_fr) VALUES($1,$2,$3) RETURNING id",
          [slug(r.game.name.en), r.game.name.en, r.game.name.fr],
        )
      ).rows[0].id,
    ),
  );
  const set = await mapped(
    db,
    provider,
    "set",
    `${r.game.key}/${r.set.key}`,
    async () =>
      String(
        (
          await db.query(
            "INSERT INTO troc.set_releases(game_id,slug,name_en,name_fr,released_on) VALUES($1,$2,$3,$4,$5) RETURNING id",
            [
              game,
              slug(r.set.name.en),
              r.set.name.en,
              r.set.name.fr,
              r.set.releasedOn,
            ],
          )
        ).rows[0].id,
      ),
  );
  const product = await mapped(
    db,
    provider,
    "product",
    `${r.game.key}/${r.set.key}/${r.product.key}`,
    async () =>
      String(
        (
          await db.query(
            "INSERT INTO troc.catalog_products(game_id,set_id,slug,name_en,name_fr,product_type) VALUES($1,$2,$3,$4,$5,$6) RETURNING id",
            [
              game,
              set,
              slug(r.product.name.en),
              r.product.name.en,
              r.product.name.fr,
              r.product.type,
            ],
          )
        ).rows[0].id,
      ),
  );
  await db.query("UPDATE troc.games SET name_en=$2,name_fr=$3 WHERE id=$1", [
    game,
    r.game.name.en,
    r.game.name.fr,
  ]);
  await db.query(
    "UPDATE troc.set_releases SET name_en=$2,name_fr=$3,released_on=$4 WHERE id=$1",
    [set, r.set.name.en, r.set.name.fr, r.set.releasedOn],
  );
  await db.query(
    "UPDATE troc.catalog_products SET name_en=$2,name_fr=$3,product_type=$4 WHERE id=$1",
    [product, r.product.name.en, r.product.name.fr, r.product.type],
  );
  const printing = await mapped(
    db,
    provider,
    "printing",
    `${r.game.key}/${r.set.key}/${r.product.key}/${r.printing.language}/${r.printing.key}`,
    async () =>
      String(
        (
          await db.query(
            "INSERT INTO troc.printings(product_id,language,printing_key,collector_number,rarity,artist) VALUES($1,$2,$3,$4,$5,$6) RETURNING id",
            [
              product,
              r.printing.language,
              r.printing.key,
              r.printing.number,
              r.printing.rarity,
              r.printing.artist,
            ],
          )
        ).rows[0].id,
      ),
  );
  await db.query(
    "UPDATE troc.printings SET collector_number=$2,rarity=$3,artist=$4 WHERE id=$1",
    [printing, r.printing.number, r.printing.rarity, r.printing.artist],
  );
  const variant = String(
    (
      await db.query(
        "INSERT INTO troc.variants(printing_id,variant_key,attributes) VALUES($1,$2,$3) ON CONFLICT(printing_id,variant_key) DO UPDATE SET attributes=EXCLUDED.attributes RETURNING id",
        [printing, r.variant.key, JSON.stringify(r.variant.attributes)],
      )
    ).rows[0].id,
  );
  const mapping = await db.query(
    "SELECT variant_id FROM troc.external_catalog_mappings WHERE provider=$1 AND external_id=$2",
    [provider, r.externalId],
  );
  if (mapping.rows[0] && mapping.rows[0].variant_id !== variant)
    throw new DomainError("external_identity_conflict");
  await db.query(
    "INSERT INTO troc.external_catalog_mappings(provider,external_id,variant_id) VALUES($1,$2,$3) ON CONFLICT(provider,external_id) DO UPDATE SET last_seen_at=now()",
    [provider, r.externalId, variant],
  );
  for (const alias of r.product.aliases)
    await db.query(
      "INSERT INTO troc.catalog_aliases(product_id,locale,alias) VALUES($1,'en',$2) ON CONFLICT DO NOTHING",
      [product, alias],
    );
  if (r.image) {
    const source = (
      await db.query(
        "SELECT id FROM troc.asset_sources WHERE provider=$1 AND license=$2 AND approved_at IS NOT NULL LIMIT 1",
        [provider, r.image.license],
      )
    ).rows[0]?.id;
    if (!source) throw new DomainError("image_license_unapproved");
    await db.query(
      "INSERT INTO troc.asset_provenance(source_id,variant_id,source_url) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
      [source, variant, r.image.url],
    );
  }
  const variants = (
    await db.query(
      `SELECT v.id,p.id AS "printingId",p.language,v.variant_key AS key,v.attributes,COALESCE(p.collector_number,'') AS number,COALESCE(p.rarity,'') AS rarity,COALESCE(p.artist,'') AS artist FROM troc.variants v JOIN troc.printings p ON p.id=v.printing_id WHERE p.product_id=$1 ORDER BY p.language,v.variant_key,v.id`,
      [product],
    )
  ).rows;
  const aliases = (
    await db.query(
      "SELECT alias FROM troc.catalog_aliases WHERE product_id=$1",
      [product],
    )
  ).rows.map((x) => String(x.alias));
  const stored = (
    await db.query("SELECT slug FROM troc.catalog_products WHERE id=$1", [
      product,
    ])
  ).rows[0];
  const image =
    (
      await db.query(
        "SELECT ap.source_url FROM troc.asset_provenance ap JOIN troc.asset_sources s ON s.id=ap.source_id JOIN troc.variants v ON v.id=ap.variant_id JOIN troc.printings p ON p.id=v.printing_id WHERE p.product_id=$1 AND s.approved_at IS NOT NULL ORDER BY ap.captured_at DESC LIMIT 1",
        [product],
      )
    ).rows[0]?.source_url ?? null;
  const document = {
    id: product,
    slug: stored.slug,
    name: r.product.name,
    gameId: game,
    setId: set,
    type: r.product.type,
    variants,
    aliases,
    imageUrl: image,
    demo,
  };
  const searchText = [
    r.product.name.en,
    r.product.name.fr,
    r.game.name.en,
    r.set.name.en,
    r.set.name.fr,
    ...aliases,
    ...variants.flatMap((v) => [v.number, v.artist, v.rarity]),
  ]
    .join(" ")
    .toLowerCase();
  await db.query(
    "INSERT INTO troc.catalog_documents(product_id,search_text,document) VALUES($1,$2,$3) ON CONFLICT(product_id) DO UPDATE SET search_text=EXCLUDED.search_text,document=EXCLUDED.document,updated_at=now()",
    [product, searchText, JSON.stringify(document)],
  );
}
export async function runImport(
  db: Connection,
  provider: CatalogImportProvider,
  actor: Principal,
  key: string,
) {
  authorize(actor, "catalog:write");
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(key))
    throw new DomainError("invalid_import_key");
  const approval = (
    await db.query(
      "SELECT * FROM troc.catalog_providers WHERE id=$1 AND catalog_approved=true",
      [provider.id],
    )
  ).rows[0];
  if (!approval) throw new DomainError("catalog_license_unapproved", 403);
  await db.query("SELECT pg_advisory_lock(hashtext($1))", [
    `troc-import:${provider.id}`,
  ]);
  let runId: string | undefined;
  try {
    const previous = (
      await db.query(
        "SELECT * FROM troc.catalog_import_runs WHERE provider=$1 AND idempotency_key=$2",
        [provider.id, key],
      )
    ).rows[0];
    if (previous) return previous;
    runId = String(
      (
        await db.query(
          "INSERT INTO troc.catalog_import_runs(provider,idempotency_key,actor_id) VALUES($1,$2,$3) RETURNING id",
          [provider.id, key, actor.userId],
        )
      ).rows[0].id,
    );
    let cursor: string | undefined;
    let processed = 0,
      succeeded = 0,
      failed = 0;
    const seen = new Set<string>();
    for (let page = 0; page < 50; page++) {
      const batch = await provider.records({ cursor, limit: 200 });
      if (batch.items.length > 200)
        throw new DomainError("provider_page_limit");
      await db.query("BEGIN");
      try {
        for (const raw of batch.items) {
          processed++;
          await db.query("SAVEPOINT import_row");
          try {
            const record = validateImport(raw);
            await importRecord(
              db,
              provider.id,
              record,
              approval.images_approved === true,
              approval.demo === true,
            );
            succeeded++;
            await db.query("RELEASE SAVEPOINT import_row");
          } catch (error) {
            failed++;
            await db.query("ROLLBACK TO SAVEPOINT import_row");
            await db.query("RELEASE SAVEPOINT import_row");
            await db.query(
              "INSERT INTO troc.catalog_import_failures(run_id,external_id,error_code) VALUES($1,$2,$3)",
              [
                runId,
                typeof raw?.externalId === "string"
                  ? raw.externalId.slice(0, 300)
                  : null,
                error instanceof DomainError ? error.code : "record_rejected",
              ],
            );
          }
        }
        await db.query(
          "UPDATE troc.catalog_import_runs SET processed=$2,succeeded=$3,failed=$4,cursor=$5 WHERE id=$1",
          [runId, processed, succeeded, failed, batch.nextCursor ?? null],
        );
        await db.query("COMMIT");
      } catch (error) {
        await db.query("ROLLBACK");
        throw error;
      }
      if (!batch.nextCursor) break;
      if (seen.has(batch.nextCursor))
        throw new DomainError("repeated_provider_cursor");
      seen.add(batch.nextCursor);
      cursor = batch.nextCursor;
      if (page === 49) throw new DomainError("import_page_limit");
    }
    await db.query(
      "UPDATE troc.catalog_import_runs SET status=CASE WHEN failed>0 THEN 'partial' ELSE 'completed' END,finished_at=now() WHERE id=$1",
      [runId],
    );
    await db.query(
      "INSERT INTO troc.audit_events(actor_id,action,entity_type,entity_id) VALUES($1,'catalog.import.completed','catalog_import',$2)",
      [actor.userId, runId],
    );
    return (
      await db.query("SELECT * FROM troc.catalog_import_runs WHERE id=$1", [
        runId,
      ])
    ).rows[0];
  } catch (error) {
    if (runId)
      await db.query(
        "UPDATE troc.catalog_import_runs SET status='failed',finished_at=now() WHERE id=$1",
        [runId],
      );
    throw error;
  } finally {
    await db.query("SELECT pg_advisory_unlock(hashtext($1))", [
      `troc-import:${provider.id}`,
    ]);
  }
}
