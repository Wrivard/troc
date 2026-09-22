# Catalog, Pricing & Search

## Catalog scope
The platform must ultimately contain full catalogs for Pokémon, Magic, Yu-Gi-Oh!, One Piece and Riftbound.

Do not manually hard-code a giant catalog.

## Critical legal/data rule
Before production ingestion, the catalog/image/reference-price provider and license must be approved.

For this build:
1. implement TROC's canonical catalog schema;
2. implement provider adapters/import tooling;
3. use representative/demo data until a provider is approved;
4. do not scrape protected sites or card artwork;
5. preserve source/provenance information.

## Catalog import requirements
Importer must support:
- external → TROC ID mapping;
- insert/update;
- aliases;
- set/product/printing/variant relationships;
- language;
- image provenance;
- import run logs;
- failed records;
- idempotent re-runs;
- completeness report.

## Variants
Game-aware variant attributes. Do not model Pokémon-specific treatments as universal booleans.

## Languages
English and Japanese must be distinct marketplace identities where applicable.

## Reference pricing
MVP UI must support:
- Reference Price;
- Lowest Available;
- Median Available;
- historical reference chart/demo history.

Future TROC Market Price derives from real TROC completed transactions after enough volume exists.

## FX
Reference prices sourced in another currency must preserve original value and conversion metadata.
Build FxProvider abstraction.

## Search
Search canonical products, not duplicate seller listings.

Search targets:
- card/product name;
- set;
- number;
- artist where available;
- rarity;
- sealed product;
- aliases/typos.

Filters:
- game;
- set;
- product type;
- price;
- language;
- variant;
- rarity;
- condition availability.

Search result cards show image, product/card, set + number, Reference Price, Lowest Available, available quantity and seller count.
