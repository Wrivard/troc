# Milestone 5.5 — Founding Seller & Seller Referral System

## Purpose
Turn early sellers into a supply-acquisition channel while rewarding meaningful marketplace contribution instead of empty signups.

## Requirements
### Founding Seller model
Track founding status, qualification date, active inventory contribution, qualified referrals and configurable rewards. Potential rewards: reduced/temporary-zero marketplace fees, badge, priority support, beta/integration access. Do not permanently hard-code economics.

### Referral attribution
Give eligible sellers a unique referral code/URL such as `troc.ca/r/{code}`. Persist referrer, referred user, timestamp, seller activation, inventory qualification, first successful transaction, qualification status/date and reward status.

### Qualification
Do not reward signup alone. Make criteria admin-configurable and able to consider verified seller, minimum active inventory, inventory age, first successful order and good standing.

### Seller dashboard
Show referral link, invited sellers, pending/qualified referrals, earned benefits and progress.

### Anti-abuse
Protect against self-referrals, duplicates, fake sellers/inventory, circular schemes, referral farming and fraudulent trigger transactions. Support logged admin review/override.

### Admin controls
Configure campaign dates, thresholds, rewards, founding-seller limits, eligibility and program activation.

### Documentation
Document Founding Seller and Seller Referral programs, qualification, reward lifecycle and anti-abuse. Public copy must match actual configuration.

## Audit
Test referral → signup → seller activation → inventory qualification → transaction → reward, including attribution, duplicates, refunds/cancellations, self-referrals and admin adjustments.
