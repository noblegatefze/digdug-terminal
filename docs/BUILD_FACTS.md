# DIGDUG.DO Build Facts (Canonical for Current Deployment)

**Build:** v0.1.16.0  
**Phase:** Zero Phase Public Testnet  

**Authority:**  
This document is canonical for **current build behavior, UX flows, and operational FAQs**.

**Rule:**  
If something is not defined in this file or in `/whitepaper/**`, Digster AI must answer:  
**“Not specified in canonical DIGDUG docs.”**

---

## What is DIGDUG.DO?

DIGDUG.DO is a terminal-style protocol where users “dig” sponsor boxes to receive rewards.  
It is designed to be transparent, rule-based, and resistant to manipulation.

---

## What is USDDD?

- **USDDD is protocol fuel**, not a stablecoin in Phase Zero.
- It is used to dig boxes and interact with protocol mechanics.

### Phase Zero (Public Testnet)
- USDDD is **mock**.
- USDDD balances are **local per Terminal Pass per device**.
- USDDD is **not withdrawable**.
- USDDD exists only to test UX, pacing, and protocol flows.

### Mainnet (Future)
- USDDD will be a **real on-chain token**.
- **Acquired USDDD** may be withdrawable.
- **Genesis / claimed USDDD** will not be withdrawable.
- Exact economics will be defined before launch.

---

## Phase Zero Rules (Important)

### Local vs Global State

**Local (device-bound, intentional):**
- USDDD balance (fuel)
- Some UI-only elements (animations/progress display)
- Wallet registry in Phase Zero (mock)

**Global (server & DB authoritative):**
- Sponsor boxes (configuration & live balances)
- Per-user box cooldowns/limits (dig gate)
- Golden Finds (global pacing + cap)
- Golden Claims + payout records
- Claims ledger (treasure claims)
- Global stats & observability

---

## Sponsor Boxes (Global)

In v0.1.16.0, sponsor boxes are **GLOBAL** and DB-backed.

### Canonical tables
- `dd_boxes` — box configuration (id/chain/token/cost/cooldown/status)
- `dd_box_ledger` — immutable accounting entries
- `dd_box_accounting` (view) — rollup derived from `dd_box_ledger`

### Ledger entry types (meaning)
- `fund_in` — increases deposited balance (seed/mock funding in Phase Zero)
- `adjust` — increases or decreases deposited balance (safe mock tuning without deleting history)
- `claim_reserve` — reserves rewards from the box (reduces available balance)
- `withdraw_out` — finalizes withdrawal (reduces available balance)

### Available balance (canonical)
`available = deposited_total - withdrawn_total - claimed_unwithdrawn`

### What “global” means
- If any user digs a box successfully, the box’s available balance decreases globally for everyone.
- Cooldowns are per-user (see Dig Gate), not shared across all users.

---

## Dig Gate (Global Cooldowns & Limits)

In v0.1.16.0, dig cooldown and per-user limits are enforced globally via DB.

### Canonical table
- `dd_box_dig_gate` — per-user per-box counter and last dig time

### Canonical API
- `POST /api/boxes/gate`  
  Checks and increments gate state for (username + box_id).  
  Denies with reason:
  - `cooldown`
  - `limit`  
  Returns `nextAllowedAt` for cooldown cases.

### Cooldown behavior (canonical)
- Cooldown is **per user per box** (global enforcement, not global shared lock).
- Another user can dig the same box if they are not on cooldown and the box has available balance.

---

## Ledger-backed Reserves (Global)

On dig success, the system creates a global reserve entry:

- `POST /api/boxes/reserve` inserts a `claim_reserve` into `dd_box_ledger`  
- Idempotency uses `dig_id` (retries must not double-reserve)

This makes global box depletion **provable and auditable**.

---

## Claims (Treasure)

Claims are stored in:
- `dd_treasure_claims` with status `CLAIMED`, then later `WITHDRAWN`.

Security rule:
- The server resolves token/chain metadata from `dd_boxes` when inserting claims.
- Clients cannot spoof token metadata.

---

## Terminal Pass (Onboarding)

### How do I register?
- Open https://digdug.do
- In the Terminal, type: `register`
- Follow the on-screen prompts.

### How do I log in?
- In the Terminal, type: `login`

---

## Telegram Verification

Some actions require Telegram verification.

### How do I verify Telegram?
1. DM **@DigsterBot**
2. Run: `/verify`
3. Copy the verification code (DG-XXXX)
4. In the DIGDUG Terminal, type: `verify DG-XXXX`

Verification binds:
- Terminal Pass
- Telegram user
- Global protocol actions (Golden Finds, claims)

---

## Golden Finds (Global)

- Golden Finds are **GLOBAL** and server-enforced.
- Limit: **5 Golden Finds per UTC day (global total)**.
- Claims require:
  - Verified Terminal Pass
  - Verified Telegram user

### How do I claim a Golden Find?
In Telegram: `/claim GF-XXXX`

### How are Golden Finds paid?
- Admin marks payouts using: `/paid GF-XXXX 0xTXHASH`
- Receipt is posted publicly in the group.
- Winner also receives a DM confirmation.

---

## Wallet Connection (Phase Zero)

**Phase Zero:**
- Wallet connection is **mock** (no real on-chain interaction yet).

**Mainnet (Future):**
- Wallet connection will be real and used for withdrawals.

---

## 2FA (Two-Factor Authentication)

**Phase Zero:**
- 2FA is **mock UX** only.

**Mainnet (Future):**
- 2FA will use Google Authenticator or equivalent with real enforcement.

---

## Whitepaper

Canonical protocol documentation lives in `/whitepaper/**`.  
Digster AI reads from the whitepaper repository plus this build facts file.

---

## Digster AI Rules

Digster AI:
- Answers only from:
  1. `docs/BUILD_FACTS.md`
  2. `/whitepaper/**`
- Does **not guess**
- Does **not invent rules**
- Says **“Not specified in canonical DIGDUG docs”** when required

This is intentional.
