# Milestone 8.5 — TROC Smart Cart

## Purpose
Create a buyer differentiator optimized for fragmented Canadian inventory and shipping. Optimize **total delivered basket cost**, not simply the cheapest individual cards.

## Requirements
Consider requested cards/quantities, acceptable conditions/languages/variants, listing prices, seller inventory overlap, shipping tiers/costs, seller minimums where applicable and missing cards.

Support understandable modes including **Lowest delivered cost** and **Fewest sellers**. Future preferences can include preferred sellers/conditions.

Clearly show requested/fulfilled/missing cards, sellers, card subtotal, shipping by seller and delivered total. If showing savings, compare against a clearly defined valid alternative; never invent savings.

Allow buyers to replace suggested listings, remove cards, change preferences and choose alternate solutions where appropriate.

### Algorithm architecture
Do not use brute-force seller/listing combinations that become computationally impossible. Design a scalable optimization approach, document assumptions/tradeoffs, and produce deterministic/explainable results where practical.

Account for inventory changing between optimization and checkout. Revalidate price/quantity before order creation and handle unavailable inventory gracefully.

Document algorithm, shipping assumptions, constraints, fallback behavior and savings methodology.

## Audit
Test 5-, 25-, 100- and large-wishlist carts; single/multi-seller cases; shipping tiers; missing cards; equal-cost solutions; inventory changes; performance. Fix and optimize.
