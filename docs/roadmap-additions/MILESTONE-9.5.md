# Milestone 9.5 — Canadian Market Data

## Purpose
Once TROC has enough legitimate transactions, create trustworthy CAD marketplace analytics from TROC's own activity.

## Requirements
Clearly separate external/reference pricing from **TROC transaction-derived data**. Never label external estimates as TROC market data.

Potential TROC metrics when statistically meaningful:
- recent legitimate sale
- 30-day median
- 30-day sales volume
- current lowest listing
- available quantity
- historical price series

Define minimum sample/quality thresholds. If data is insufficient, say so rather than manufacturing a market price.

Exclude or appropriately handle cancelled/refunded/fraudulent transactions, self-dealing/wash trading, suspicious transactions and extreme anomalies. Build monitoring for manipulation.

Store market history efficiently; avoid expensive recomputation of the entire order history on every page load.

Document exact methodology, eligible transactions, windows, outlier handling, insufficient-data behavior and distinction between TROC/external data.

## Audit
Validate calculations against known datasets; test low-volume cards, refunds, cancellations, suspicious transactions, outliers, variants/conditions and performance. Fix and optimize.
