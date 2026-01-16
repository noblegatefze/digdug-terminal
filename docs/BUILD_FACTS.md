# DIGDUG.DO Build Facts (Canonical for Current Deployment)

**Build:** v0.1.15.0  
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

## How much USDDD can I claim per day?

- **Limit:** 5 USDDD per UTC day  
- Applies in:
  - Phase Zero (mock)
  - Mainnet (real)
- Enforced by the protocol.

---

## What happens to the USDDD I use?

- USDDD used to dig is **consumed**.
- Consumed USDDD is credited to the **protocol treasury**.
- Consumption is **final** and cannot be reversed.

---

## Phase Zero Rules (Important)

### Local vs Global State

**Local (device-bound, intentional):**
- USDDD balance
- Phase Zero UI box state

**Global (server-enforced):**
- Golden Finds
- Golden Claims
- Admin payout records
- Global stats and observability

---

## Terminal Pass (Onboarding)

### How do I register?
- Open https://digdug.do
- In the Terminal, type:
  `register`
- Follow the on-screen prompts.

### How do I log in?
- In the Terminal, type:
  `login`

---

## Telegram Verification

Some actions require Telegram verification.

### How do I verify Telegram?
1. DM **@DigsterBot**
2. Run: `/verify`
3. Copy the verification code (DG-XXXX)
4. In the DIGDUG Terminal, type:  
   `verify DG-XXXX`

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
In Telegram:  
`/claim GF-XXXX`

### How are Golden Finds paid?
- Admin marks payouts using:  
  `/paid GF-XXXX 0xTXHASH`
- Receipt is posted publicly in the group.
- Winner also receives a DM confirmation.

---

## Boxes (Sponsor Campaigns)

### What is a Box?
A Box is a sponsor-created campaign that users dig to receive rewards.

### How do sponsor boxes work?
- Sponsors create a box using the Sponsor Console.
- Sponsors configure:
  - Token metadata
  - Cooldowns
  - Limits
- Users dig sponsor boxes and receive rewards.
- Sponsors monitor box performance via stats.

### Cooldowns
- Boxes may have cooldowns (e.g. 15–60 minutes).
- Cooldowns are enforced by box rules and shown in the UI.

### Can sponsors edit a box after activation?
- Not specified in canonical DIGDUG docs.

---

## Rewards

### Are rewards real?

**Phase Zero (Testnet):**
- Rewards are **mock**.
- Used only to test UX and protocol logic.

**Mainnet (Future):**
- Rewards will be **real tokens**.
- Withdrawable according to canonical rules.

---

## Wallet Connection

### How do I connect a wallet?

**Phase Zero (Testnet):**
- Wallet connection is **mock**.
- No real on-chain interaction occurs.

**Mainnet (Future):**
- Wallet connection will be **real**.
- Used for withdrawals and on-chain claims.

---

## 2FA (Two-Factor Authentication)

### How does 2FA work?

**Phase Zero (Testnet):**
- 2FA is **mock**.
- You may enter **any 6-digit code**.
- This is for UX testing only.

**Mainnet (Future):**
- 2FA will use **Google Authenticator** or equivalent.
- Real enforcement will apply.

---

## How do I see my rewards?

- Use the Terminal UI.
- Use Sponsor or User stats commands where available.
- Golden Find receipts are also posted in Telegram.

---

## How do I see how many Golden Finds are available?

- Availability is global and time-based.
- Digster AI can answer current limits.
- UI messaging reflects pacing, not exact counters.

---

## Whitepaper

### Where is the whitepaper?
- Canonical protocol documentation lives in `/whitepaper/**`
- Digster AI reads directly from the whitepaper repository.

---

## Is there a DIGDUG token?

- **USDDD** is the protocol fuel token.
- In Phase Zero, it is mock.
- In Mainnet, it will be a real on-chain asset.
- No other tokens are defined at this time.

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
