"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * DIGDUG.DO Terminal
 * v0.1.13.X — Phase Zero
 *
 * Implemented:
 * - Canonical chains (Top 5): ETH / BNB / SOL / ARB / BASE (no free-typed chains)
 * - Sponsor: set limit (max digs per user per box). set max is deprecated alias.
 * - Dig gating: per Terminal Pass (username), not per wallet.
 * - Find tiers restored (BASE/LOW/MEDIUM/HIGH/MEGA FIND)
 * - Withdraw: defaults to connected wallet, warns user pays gas, warns on chain mismatch (non-strict)
 * - Treasure claim-ledger + FIFO consumption (multi-box + multi-chain correctness)
 * - Wallet uniqueness: global across all Terminal Passes on this device
 *   - EVM uniqueness is address-only across ETH/BNB/ARB/BASE
 *   - Solana uniqueness is separate
 */

type ConsoleMode = "USER" | "SPONSOR" | "ADMIN";
type LineKind = "sys" | "info" | "ok" | "warn" | "err" | "cmd";

type TermLine = { id: string; t: string; console?: ConsoleMode; kind: LineKind; text: string };

type PromptMode =
  | "IDLE"
  | "HELP_SELECT"
  | "DOCS_SELECT"
  | "CONFIRM_NUKE"
  | "REG_USER"
  | "REG_PASS"
  | "LOGIN_USER"
  | "LOGIN_PASS"
  | "NEED_2FA"
  | "ACQUIRE_USDDD_AMOUNT"
  | "DIG_CHOICE"
  | "DIG_SELECT"
  | "DIG_CONFIRM"
  | "WITHDRAW_PICK"
  | "WITHDRAW_USDDD_AMOUNT"
  | "WITHDRAW_USDDD_ADDR"
  | "WITHDRAW_TREASURE_PICK"
  | "WITHDRAW_TREASURE_AMOUNT"
  | "WITHDRAW_TREASURE_ADDR"
  | "ADMIN_RESET_PICK"
  // wallet prompts
  | "WALLET_CONNECT_CHAIN_PICK"
  | "WALLET_CONNECT_LABEL"
  | "WALLET_CONNECT_ADDR"
  | "WALLET_SWITCH_PICK"
  | "WALLET_FORGET_PICK"
  // sponsor prompts
  | "SP_HARDGATE_CONFIRM"
  | "SP_CREATE_CHAIN_PICK"
  | "SP_CREATE_DECLARATION_CONFIRM"
  | "SP_CONFIG_PICK"
  | "SP_CHAIN_PICK"
  | "SP_TOKEN_ADDRESS"
  | "SP_SET_COST"
  | "SP_SET_COOLDOWN"
  | "SP_SET_REWARD_MODE"
  | "SP_SET_REWARD_FIXED"
  | "SP_SET_REWARD_RANDOM_MIN"
  | "SP_SET_REWARD_RANDOM_MAX"
  | "SP_SET_LIMIT"
  | "SP_META_PICK"
  | "SP_META_VALUE"
  | "SP_BOX_PICK_FOR_USE";

type PromptState = {
  mode: PromptMode;

  authUser?: string;

  twoFaPurpose?: "ENROLL" | "STEPUP";
  twoFaSeed?: string;

  selectedCampaignId?: string;

  withdrawKind?: "USDDD" | "TREASURE";
  selectedAsset?: string; // treasure group key "chainId|symbol|tokenAddress"
  amount?: number;
  address?: string;

  // wallet connect temp
  walletTempChainId?: ChainId;

  // sponsor temp
  spTempRandMin?: number;
  spPickList?: string[]; // campaign ids
  spMetaKey?: keyof SponsorMeta;
};

type TerminalPass = {
  username: string;
  passHash: string;
  createdAt: number;
  twoFaEnabled: boolean;
  twoFaSeed?: string;
};

type WalletEntry = {
  id: string;
  label: string;
  address: string;
  chainId: ChainId;
  createdAt: number;
};

type RewardMode = "FIXED" | "RANDOM";

type PriceMockMode = "RANDOM" | "ALWAYS" | "NEVER";
type CampaignStatus = "ACTIVE" | "INACTIVE" | "ENDED";
type CampaignStage = "DEPLOYED_EMPTY" | "TOKEN_BOUND" | "FUNDED" | "CONFIGURED";

type SponsorMeta = {
  website?: string;
  x?: string;
  whitepaper?: string;
  telegram?: string;
  discord?: string;
  cmc?: string;
  cg?: string;
};

type ChainId = "ETH" | "BNB" | "SOL" | "ARB" | "BASE";
type ChainDef = { id: ChainId; label: string; standard: string; family: "EVM" | "SOL"; nativeSymbol: string };

const CHAINS: ChainDef[] = [
  { id: "ETH", label: "Ethereum", standard: "ERC-20", family: "EVM", nativeSymbol: "ETH" },
  { id: "BNB", label: "BNB Chain", standard: "BEP-20", family: "EVM", nativeSymbol: "BNB" },
  { id: "SOL", label: "Solana", standard: "SPL", family: "SOL", nativeSymbol: "SOL" },
  { id: "ARB", label: "Arbitrum", standard: "ERC-20", family: "EVM", nativeSymbol: "ETH" },
  { id: "BASE", label: "Base", standard: "ERC-20", family: "EVM", nativeSymbol: "ETH" },
];

function chainLabel(chainId: ChainId) {
  const c = CHAINS.find((x) => x.id === chainId);
  return c ? `${c.label} (${c.standard})` : String(chainId);
}
function chainFamily(chainId: ChainId): "EVM" | "SOL" {
  const c = CHAINS.find((x) => x.id === chainId);
  return c?.family ?? "EVM";
}
function chainNative(chainId: ChainId) {
  const c = CHAINS.find((x) => x.id === chainId);
  return c?.nativeSymbol ?? "NATIVE";
}

type Campaign = {
  id: string;

  ownerUsername: string;

  deployChainId: ChainId;
  deployFeeNativeSymbol: string;
  deployFeeNativeAmount: number;

  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  tokenChainId?: ChainId;

  onChainBalance: number;
  claimedUnwithdrawn: number;
  depositedTotal: number;
  withdrawnTotal: number;

  meta: SponsorMeta;

  costUSDDD: number;
  cooldownHours: number;

  rewardMode: RewardMode;
  fixedReward: number;
  randomMin: number;
  randomMax: number;

  // NEW: per-user dig limit for this box
  // null => unlimited, 1 => one-time box, N => max N digs/user
  maxDigsPerUser: number | null;

  stage: CampaignStage;
  status: CampaignStatus;

  createdAt: number;
};


/** --- Mock token price (Phase Zero; oracle-safe) --- **/
function mockTokenUsdPrice(c: Campaign, mode: PriceMockMode): number | null {
  const sym = c.tokenSymbol ?? "";
  const addr = c.tokenAddress ?? "";
  if (!sym || !addr) return null;

  const seed = `${c.id}|${c.tokenChainId ?? c.deployChainId}|${sym}|${addr}`.toLowerCase();

  if (mode === "NEVER") return null;

  const has = mode === "ALWAYS" ? true : seeded01(seed + "|has") < 0.65;
  if (!has) return null;

  const r = seeded01(seed + "|p");
  let price = 0;

  if (r < 0.15) {
    // micro caps
    price = 0.0001 + seeded01(seed + "|a") * 0.0099;
  } else if (r < 0.5) {
    // sub $1
    price = 0.01 + seeded01(seed + "|b") * 0.99;
  } else if (r < 0.85) {
    // $1 - $20
    price = 1 + seeded01(seed + "|c") * 19;
  } else {
    // $20 - $200
    price = 20 + seeded01(seed + "|d") * 180;
  }

  // keep stable but readable
  return Math.max(0.000001, price);
}


type DigRecord = {
  id: string;
  at: string;
  campaignId: string;
  label: string;
  spentUSDDD: number;
  rewardSymbol: string;
  rewardAmount: number;
  rewardMode: RewardMode;
  rewardUsdPrice?: number | null;
  rewardUsdValue?: number | null;
};

type ClaimKind = "TREASURE";
type ClaimStatus = "CLAIMED" | "WITHDRAWN";

type TreasureClaim = {
  id: string;
  user: string; // Terminal Pass (username)
  kind: ClaimKind;

  campaignId: string; // box id
  chainId: ChainId; // asset chain
  tokenAddress: string;
  tokenSymbol: string;

  amount: number;
  status: ClaimStatus;

  createdAt: number;
  createdAtStr: string;
  withdrawnAt?: number;
};

type TreasureGroup = {
  key: string; // "chainId|symbol|tokenAddress"
  chainId: ChainId;
  symbol: string;
  tokenAddress: string;
  amount: number;
  claimsCount: number;
  boxesCount: number;
};

// per-user per-box dig state (Phase Zero local)
type DigGateState = { count: number; lastAt: number | null };

const BUILD_VERSION = "Zero Phase v0.1.13.7";

// local storage keys
const STORAGE_KEY_PASS = "dd_terminal_pass_v1";
const STORAGE_KEY_USERS = "dd_terminal_users_v1";
const STORAGE_KEY_ALLOC_LAST_AT = "dd_usddd_alloc_last_at_v1";

// acquired USDDD lifetime totals (per Terminal Pass, device-local)
const STORAGE_KEY_ACQUIRED_TOTAL_V1 = "dd_usddd_acquired_total_v1";


// wallets
const STORAGE_KEY_WALLETS_V2 = "dd_wallets_mock_v2";
const STORAGE_KEY_WALLET_V1 = "dd_wallet_mock_v1";

// global wallet registry across terminal passes (device-local)
const STORAGE_KEY_WALLET_REGISTRY = "dd_wallet_registry_v1";

// dig gating persistence (optional; keep in memory for now)
const STORAGE_KEY_DIG_GATE = "dd_dig_gate_v1";

// mock price mode (Phase Zero)
const STORAGE_KEY_PRICE_MOCK_MODE = "dd_price_mock_mode_v1";
const STORAGE_KEY_INSTALL_ID = "dd_install_id_v1";

// locked defaults
const DAILY_ALLOCATION = 5;
const BASE_CAP = 20;

// acquisition cap (acquired only; not daily allocation)
const ACQUIRE_CAP = 1000;


// sponsor bounds
const COST_MIN = 0.01;
const COST_MAX = 25;
const COOLDOWN_MIN_H = 1;
const COOLDOWN_MAX_H = 72;

// always-success safety floor
const MIN_YIELD_FLOOR = 0.000001;

// docs
const GITHUB_REPO_BASE = "https://github.com/noblegatefze/digdug-whitepaper";
const DOCS = {
  genesis: `${GITHUB_REPO_BASE}/blob/main/GENESIS.md`,
  whitepaper: `${GITHUB_REPO_BASE}/blob/main/WHITEPAPER.md`,
  monetary: `${GITHUB_REPO_BASE}/blob/main/USDDD_MONETARY_POLICY.md`,
  glossary: `${GITHUB_REPO_BASE}/blob/main/DIGDUG_TERMINOLOGY_GLOSSARY.md`,
};

function nowTs() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function nowLocalDateTime() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function ensureInstallId() {
  try {
    const existing = localStorage.getItem(STORAGE_KEY_INSTALL_ID);
    if (existing && existing.length >= 8) return existing;
    const fresh =
      (typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : null) ??
      `inst_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
    localStorage.setItem(STORAGE_KEY_INSTALL_ID, fresh);
    return fresh;
  } catch {
    return `inst_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }
}
function normalizeInput(v: string) {
  return v.trim();
}
function C(cmd: string) {
  return `[[C]]${cmd}[[/C]]`;
}
function G(val: string) {
  return `[[G]]${val}[[/G]]`;
}
function GNum(n: number, digits = 2) {
  const s = n.toFixed(digits);
  return n > 0 ? G(s) : s;
}
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function fmtMs(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
function isYes(v: string) {
  const s = v.trim().toLowerCase();
  return s === "y" || s === "yes";
}
function isNo(v: string) {
  const s = v.trim().toLowerCase();
  return s === "n" || s === "no";
}
function passHashOf(pw: string) {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) + h) ^ pw.charCodeAt(i);
  return (h >>> 0).toString(16).padStart(8, "0");
}
function shortAddr(addr: string) {
  if (!addr) return "";
  if (addr.length <= 18) return addr;
  return `${addr.slice(0, 10)}…${addr.slice(-6)}`;
}
function looksLikeAddress(s: string) {
  return s.trim().length >= 6;
}
function normalizeEvmAddr(a: string) {
  return a.trim().toLowerCase();
}
function isLikelyEvmAddress(a: string) {
  const t = a.trim();
  return /^0x[a-fA-F0-9]{8,}$/.test(t);
}


/** --- Mock price helpers (Phase Zero; deterministic) --- **/
function hash32(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seeded01(seed: string) {
  // 0..1 (exclusive-ish)
  const h = hash32(seed);
  return (h % 1000000) / 1000000;
}
function fmtUsdPrice(p: number) {
  if (!Number.isFinite(p)) return "N/A";
  if (p < 1) {
    const s = p.toFixed(6);
    return s.replace(/0+$/, "").replace(/\.$/, "");
  }
  return p.toFixed(2);
}
function fmtUsdValue(v: number) {
  if (!Number.isFinite(v)) return "N/A";
  return v.toFixed(2);
}


function loadUsers(): Record<string, TerminalPass> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, TerminalPass>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function saveUsers(users: Record<string, TerminalPass>) {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch {
    // ignore
  }
}

/** --- Acquired USDDD totals (device-local, per Terminal Pass) --- **/
type AcquiredTotals = Record<string, number>;
function loadAcquiredTotals(): AcquiredTotals {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACQUIRED_TOTAL_V1);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AcquiredTotals;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function saveAcquiredTotals(m: AcquiredTotals) {
  try {
    localStorage.setItem(STORAGE_KEY_ACQUIRED_TOTAL_V1, JSON.stringify(m));
  } catch {
    // ignore
  }
}
function getAcquiredTotalForUser(username: string | null) {
  if (!username) return 0;
  const m = loadAcquiredTotals();
  const v = Number(m[username] ?? 0);
  return Number.isFinite(v) ? v : 0;
}
function addAcquiredForUser(username: string, amt: number) {
  const m = loadAcquiredTotals();
  const prev = Number(m[username] ?? 0);
  const safePrev = Number.isFinite(prev) ? prev : 0;
  const next = safePrev + amt;
  m[username] = next;
  saveAcquiredTotals(m);
  return next;
}


function seedSponsorCampaigns(): Campaign[] {
  const mk = (id: string, chainId: ChainId, sym: string, cost: number, cooldown: number, balance: number): Campaign => ({
    id,
    ownerUsername: "system",
    deployChainId: chainId,
    deployFeeNativeSymbol: chainNative(chainId),
    deployFeeNativeAmount: 0,
    tokenAddress: "0xSEED…",
    tokenSymbol: sym,
    tokenDecimals: chainFamily(chainId) === "SOL" ? 9 : 18,
    tokenChainId: chainId,
    onChainBalance: balance,
    claimedUnwithdrawn: 0,
    depositedTotal: balance,
    withdrawnTotal: 0,
    meta: {},
    costUSDDD: cost,
    cooldownHours: cooldown,
    rewardMode: "RANDOM",
    fixedReward: 0.1,
    randomMin: 0.05,
    randomMax: 0.5,
    maxDigsPerUser: null,
    stage: "CONFIGURED",
    status: "ACTIVE",
    createdAt: Date.now() - 100000,
  });

  const seeded = [
    mk("sand", "ETH", "SAND", 1, 6, 100000),
    mk("thor", "ARB", "THOR", 1.25, 12, 50000),
    mk("meme", "SOL", "MEME", 0.75, 3, 25000),
    mk("enrg", "BASE", "ENRG", 1.5, 24, 65000),
    mk("cake", "BNB", "CAKE", 0.6, 8, 80000),
  ];

  // seed some sponsor metadata for DD testing (leave others blank)
  seeded[0] = { ...seeded[0], meta: { website: "https://example.com", x: "https://x.com/example" } };
  seeded[2] = { ...seeded[2], meta: { telegram: "https://t.me/example", discord: "https://discord.gg/example" } };

  return seeded;
}

function renderSegments(text: string) {
  const out: React.ReactNode[] = [];
  let i = 0;

  const pushPlainWithLinks = (s: string) => {
    if (!s) return;
    const urlRe = /(https?:\/\/[^\s]+)/g;
    const parts = s.split(urlRe);
    for (let p = 0; p < parts.length; p++) {
      const part = parts[p];
      if (!part) continue;
      if (/^https?:\/\//.test(part)) {
        out.push(
          <a key={`u_${i}_${p}_${part}`} href={part} target="_blank" rel="noreferrer" className="dd-link">
            {part}
          </a>
        );
      } else {
        out.push(part);
      }
    }
  };

  while (i < text.length) {
    const cStart = text.indexOf("[[C]]", i);
    const gStart = text.indexOf("[[G]]", i);
    const next = [cStart, gStart].filter((x) => x !== -1);

    if (next.length === 0) {
      pushPlainWithLinks(text.slice(i));
      break;
    }

    const start = Math.min(...next);
    pushPlainWithLinks(text.slice(i, start));

    if (start === cStart) {
      const end = text.indexOf("[[/C]]", start + 5);
      if (end === -1) {
        pushPlainWithLinks(text.slice(start));
        break;
      }
      const content = text.slice(start + 5, end);
      out.push(
        <span key={`c_${start}`} className="dd-cmdtok">
          {content}
        </span>
      );
      i = end + 6;
      continue;
    }

    if (start === gStart) {
      const end = text.indexOf("[[/G]]", start + 5);
      if (end === -1) {
        pushPlainWithLinks(text.slice(start));
        break;
      }
      const content = text.slice(start + 5, end);
      out.push(
        <span key={`g_${start}`} className="dd-seg-g">
          {content}
        </span>
      );
      i = end + 6;
      continue;
    }

    i = start + 1;
  }

  return out;
}

/** --- Treasure grouping helpers --- **/
function treasureGroupKey(chainId: ChainId, symbol: string, tokenAddress: string) {
  return `${chainId}|${symbol}|${tokenAddress}`;
}
function parseTreasureGroupKey(key: string) {
  const [chainIdRaw, symbol, tokenAddress] = key.split("|");
  const chainId = (chainIdRaw as ChainId) ?? "ETH";
  return { chainId, symbol: symbol ?? "", tokenAddress: tokenAddress ?? "" };
}

/** --- Find tiers (cosmetic only) --- **/
function findTier(c: Campaign, rewardAmt: number) {
  if (c.rewardMode !== "RANDOM") return "FIND";
  const min = Math.max(MIN_YIELD_FLOOR, Math.min(c.randomMin, c.randomMax));
  const max = Math.max(min, c.randomMax);
  const span = Math.max(MIN_YIELD_FLOOR, max - min);
  const p = clamp((rewardAmt - min) / span, 0, 1);

  if (p < 0.1) return "BASE FIND";
  if (p < 0.35) return "LOW FIND";
  if (p < 0.7) return "MEDIUM FIND";
  if (p < 0.92) return "HIGH FIND";
  return "MEGA FIND";
}

/** --- Wallet registry helpers --- **/
type WalletRegistry = Record<string, { owner: string; createdAt: number }>;
function loadWalletRegistry(): WalletRegistry {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WALLET_REGISTRY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as WalletRegistry;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function saveWalletRegistry(reg: WalletRegistry) {
  try {
    localStorage.setItem(STORAGE_KEY_WALLET_REGISTRY, JSON.stringify(reg));
  } catch {
    // ignore
  }
}
function walletRegistryKey(chainId: ChainId, address: string) {
  const fam = chainFamily(chainId);
  if (fam === "EVM") return `evm:${normalizeEvmAddr(address)}`;
  return `sol:${address.trim()}`;
}

// NOTE (Phase Zero – ECONOMICS LOCK):
// USD value is COST-ANCHORED via sampleUsdTarget().
// Token "price" is DERIVED per-dig for display consistency only.
// Derived price is NOT authoritative and MUST NOT be reused as oracle data.
// Future phases may replace this with sponsor-controlled or on-chain pricing.

// ---------- Phase Zero: USD value curve (skew low-end), scaled by costUSDDD ----------
const VALUE_BUCKETS = {
  under: { p: 0.25, min: 0.10, max: 0.99 },  // * cost
  normal: { p: 0.65, min: 1.00, max: 10.00 }, // * cost
  rare: { p: 0.10, min: 11.00, max: 50.00 }   // * cost
};

// skew toward low end (your choice #2)
function skewLow01() {
  const r = Math.random();
  return r * r; // squaring biases low
}

function sampleUsdTarget(costUSDDD: number) {
  const c = Math.max(0.000001, costUSDDD);
  const x = Math.random();

  const u = VALUE_BUCKETS.under;
  const n = VALUE_BUCKETS.normal;

  const bucket =
    x < u.p ? u :
      x < u.p + n.p ? n :
        VALUE_BUCKETS.rare;

  const t = skewLow01();
  const usd = (bucket.min + (bucket.max - bucket.min) * t) * c;

  // hard caps (by-cost is inherent, but keep absolute numeric safety)
  return Math.max(0, usd);
}

export default function Page() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [toolboxOpen, setToolboxOpen] = useState(false);
  const [consoleMode, setConsoleMode] = useState<ConsoleMode>("USER");

  const sessionId = useMemo(() => uid("sess").slice(-8).toUpperCase(), []);
  const sessionStartedAt = useMemo(() => Date.now(), []);
  const installId = useMemo(() => ensureInstallId(), []);

  const consoleModeRef = useRef<ConsoleMode>("USER");
  useEffect(() => {
    consoleModeRef.current = consoleMode;
  }, [consoleMode]);

  const [cmd, setCmd] = useState("");
  const [prompt, setPrompt] = useState<PromptState>({ mode: "IDLE" });

  const [terminalPass, setTerminalPass] = useState<TerminalPass | null>(null);
  const [passLoaded, setPassLoaded] = useState(false);

  // wallets
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);
  const activeWallet = useMemo(() => wallets.find((w) => w.id === activeWalletId) ?? null, [wallets, activeWalletId]);

  // USDDD balances
  const [usdddAllocated, setUsdddAllocated] = useState(10);
  const [usdddAcquired, setUsdddAcquired] = useState(0);
  const [acquiredTotal, setAcquiredTotal] = useState(0);

  const usdddTotal = usdddAllocated + usdddAcquired;

  // protocol treasury
  const [treasuryUSDDD, setTreasuryUSDDD] = useState(0);

  // sponsor boxes
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => seedSponsorCampaigns());
  const [sponsorActiveBoxId, setSponsorActiveBoxId] = useState<string | null>(null);

  // claims + balances
  const [claims, setClaims] = useState<TreasureClaim[]>([]);
  const [treasureBalances, setTreasureBalances] = useState<Record<string, number>>({});

  // dig history
  const [digHistory, setDigHistory] = useState<DigRecord[]>([]);

  // dig gating state (per user per box)
  const [digGate, setDigGate] = useState<Record<string, DigGateState>>({});


  // mock price mode (Phase Zero)
  const [priceMockMode, setPriceMockMode] = useState<PriceMockMode>("RANDOM");
  const priceMockModeRef = useRef<PriceMockMode>("RANDOM");
  useEffect(() => {
    priceMockModeRef.current = priceMockMode;
  }, [priceMockMode]);

  // terminal
  const [lines, setLines] = useState<TermLine[]>([]);
  const termRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // refs
  const campaignsRef = useRef(campaigns);
  const usdddAllocatedRef = useRef(usdddAllocated);
  const usdddAcquiredRef = useRef(usdddAcquired);
  const usdddTotalRef = useRef(usdddTotal);
  const digHistoryRef = useRef(digHistory);
  const treasureBalancesRef = useRef(treasureBalances);
  const treasuryRef = useRef(treasuryUSDDD);
  const sponsorActiveBoxIdRef = useRef<string | null>(sponsorActiveBoxId);
  const claimsRef = useRef(claims);
  const digGateRef = useRef(digGate);

  useEffect(() => void (campaignsRef.current = campaigns), [campaigns]);
  useEffect(() => void (usdddAllocatedRef.current = usdddAllocated), [usdddAllocated]);
  useEffect(() => void (usdddAcquiredRef.current = usdddAcquired), [usdddAcquired]);
  useEffect(() => void (usdddTotalRef.current = usdddTotal), [usdddTotal]);
  useEffect(() => void (digHistoryRef.current = digHistory), [digHistory]);
  useEffect(() => void (treasureBalancesRef.current = treasureBalances), [treasureBalances]);
  useEffect(() => void (treasuryRef.current = treasuryUSDDD), [treasuryUSDDD]);
  useEffect(() => void (sponsorActiveBoxIdRef.current = sponsorActiveBoxId), [sponsorActiveBoxId]);
  useEffect(() => void (claimsRef.current = claims), [claims]);
  useEffect(() => void (digGateRef.current = digGate), [digGate]);

  const emit = (kind: LineKind, text: string) => {
    const c = consoleModeRef.current;
    setLines((prev) => [...prev, { id: uid("l"), t: nowTs(), console: c, kind, text }]);
  };


  const sendStat = (event: string, payload?: Record<string, any>) => {
    // fire-and-forget; never block gameplay
    try {
      fetch("/api/stats/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          install_id: installId,
          event,
          ts: Date.now(),
          ...payload,
        }),
      }).catch(() => { });
    } catch {
      // ignore
    }
  };

  const fetchAndPrintGlobalPulse = async () => {
    emit("sys", "Fetching global stats...");
    try {
      const r = await fetch("/api/stats/summary", { method: "GET" });
      if (!r.ok) {
        emit("warn", `Global stats unavailable (HTTP ${r.status}).`);
        return;
      }
      const data = (await r.json()) as any;

      const attempts = Number(data.digs_attempted ?? 0);
      const finds = Number(data.digs_succeeded ?? 0);
      const rejected = Math.max(0, attempts - finds);
      const rate = attempts > 0 ? (finds / attempts) * 100 : 0;

      const usdddSpent = data.usddd_spent != null ? Number(data.usddd_spent) : null;
      const withdrawals = data.withdrawals ?? "N/A";

      emit("info", "GLOBAL PULSE — ZERO PHASE PUBLIC TESTNET");
      emit("sys", "");

      emit("info", "NETWORK");
      emit("sys", `Sessions: ${data.total_sessions ?? "N/A"}`);
      emit("sys", `Active now (5m): ${data.active_now_5m ?? "N/A"}`);
      emit("sys", `Daily diggers (today): ${data.daily_active ?? "N/A"}`);
      emit("sys", "");

      emit("info", "DIGGING");
      emit("sys", `Dig attempts: ${attempts}`);
      emit("sys", `Finds: ${finds}`);
      emit("sys", `Find rate: ${rate.toFixed(2)}%`);
      if (rejected > 0) emit("sys", `Rejected digs: ${rejected}`);
      emit("sys", "");

      emit("info", "FUEL");
      emit("sys", `USDDD spent: ${usdddSpent == null ? "N/A" : usdddSpent.toFixed(2)}`);
      if (usdddSpent != null) {
        const avg = attempts > 0 ? usdddSpent / attempts : 0;
        emit("sys", `Avg fuel / attempt: ${avg.toFixed(2)}`);
      }
      emit("sys", `Withdrawals: ${withdrawals}`);
      emit("sys", "");

      // Optional extended fields (if DB function includes them)
      const bc = data.boxes_created;
      const ba = data.boxes_activated;
      const bl = data.boxes_live_now;
      const bt = data.boxes_touched_24h;
      if (bc != null || ba != null || bl != null || bt != null) {
        emit("info", "BOXES");
        if (bc != null) emit("sys", `Boxes created: ${bc}`);
        if (ba != null) emit("sys", `Boxes activated: ${ba}`);
        if (bl != null) emit("sys", `Boxes live now: ${bl}`);
        if (bt != null) emit("sys", `Boxes touched (24h): ${bt}`);
        emit("sys", "");
      }

      const rt = data.rewards_claimed_tokens_total;
      const ru = data.rewards_with_price_usd;
      const pricedCount = data.price_priced;
      const naCount = data.price_na;

      if (rt != null || ru != null || pricedCount != null || naCount != null) {
        emit("info", "REWARDS");
        if (rt != null) emit("sys", `Total rewards claimed (tokens): ${Number(rt).toFixed(2)}`);
        if (ru != null) emit("sys", `Rewards with price (mock): $${Number(ru).toFixed(2)}`);
        if (naCount != null) emit("sys", `Rewards N/A: ${naCount} finds`);
        emit("sys", "");
      }

      if (Array.isArray(data.top_boxes) && data.top_boxes.length > 0) {
        emit("info", "HOT BOXES (by digs)");
        data.top_boxes.slice(0, 5).forEach((b: any, i: number) => {
          const bid = b.box_id ?? "?";
          const ch = b.chain ?? "?";
          const digs = b.digs ?? "?";
          emit("sys", `${i + 1}) ${bid} (${ch}) — ${digs} digs`);
        });
      }
    } catch {
      emit("warn", "Global stats unavailable.");
    }
  };
  // load pass
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PASS);
      if (raw) setTerminalPass(JSON.parse(raw));
    } catch {
      // ignore
    } finally {
      setPassLoaded(true);
    }
  }, []);

  // ensure admin exists
  useEffect(() => {
    if (!passLoaded) return;
    const users = loadUsers();
    if (!users["admin"]) {
      users["admin"] = { username: "admin", passHash: passHashOf("admin123"), createdAt: Date.now(), twoFaEnabled: false };
      saveUsers(users);
    }
  }, [passLoaded]);

  // persist pass
  useEffect(() => {
    try {
      if (terminalPass) localStorage.setItem(STORAGE_KEY_PASS, JSON.stringify(terminalPass));
      else localStorage.removeItem(STORAGE_KEY_PASS);
    } catch {
      // ignore
    }
  }, [terminalPass]);

  // load wallets v2 (or import v1)
  useEffect(() => {
    if (!passLoaded) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY_WALLETS_V2);
      if (raw) {
        const parsed = JSON.parse(raw) as { wallets: WalletEntry[]; activeId: string | null };
        if (parsed && Array.isArray(parsed.wallets)) {
          setWallets(parsed.wallets);
          setActiveWalletId(parsed.activeId ?? null);
          return;
        }
      }
    } catch {
      // ignore
    }

    // v1 import (best-effort)
    try {
      const rawV1 = localStorage.getItem(STORAGE_KEY_WALLET_V1);
      if (!rawV1) return;
      const v1 = JSON.parse(rawV1) as { connected: boolean; address?: string; chain?: string };
      if (v1?.connected && v1.address) {
        // Attempt to map v1 chain string to our Top 5; default ETH.
        const s = (v1.chain ?? "").toLowerCase();
        const chainId: ChainId =
          s.includes("sol") ? "SOL" : s.includes("arb") ? "ARB" : s.includes("base") ? "BASE" : s.includes("bnb") || s.includes("bsc") ? "BNB" : "ETH";

        const imported: WalletEntry = {
          id: uid("w").slice(-10),
          label: "Imported Wallet",
          address: v1.address,
          chainId,
          createdAt: Date.now(),
        };
        setWallets([imported]);
        setActiveWalletId(imported.id);
      }
    } catch {
      // ignore
    }
  }, [passLoaded]);

  // persist wallets v2
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WALLETS_V2, JSON.stringify({ wallets, activeId: activeWalletId }));
    } catch {
      // ignore
    }
  }, [wallets, activeWalletId]);

  // load dig gate state (optional)
  useEffect(() => {
    if (!passLoaded) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DIG_GATE);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, DigGateState>;
      if (parsed && typeof parsed === "object") setDigGate(parsed);
    } catch {
      // ignore
    }
  }, [passLoaded]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DIG_GATE, JSON.stringify(digGateRef.current));
    } catch {
      // ignore
    }
  }, [digGate]);

  // load/persist price mock mode (device-local)
  useEffect(() => {
    if (!passLoaded) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PRICE_MOCK_MODE);
      const v2 = (raw ?? "").toUpperCase();
      if (v2 === "RANDOM" || v2 === "ALWAYS" || v2 === "NEVER") {
        setPriceMockMode(v2 as PriceMockMode);
      }
    } catch {
      // ignore
    }
  }, [passLoaded]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRICE_MOCK_MODE, priceMockModeRef.current);
    } catch {
      // ignore
    }
  }, [priceMockMode]);


  const authedUser = terminalPass?.username ?? null;
  const twoFaEnabled = terminalPass?.twoFaEnabled ?? false;


  // acquired total is per Terminal Pass (device-local)
  useEffect(() => {
    setAcquiredTotal(getAcquiredTotalForUser(authedUser));
  }, [authedUser]);

  // scroll
  useEffect(() => {
    if (!autoScroll) return;
    const el = termRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines, autoScroll]);

  useEffect(() => {
    const el = termRef.current;
    if (!el) return;

    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      setAutoScroll(nearBottom);
    };

    el.addEventListener("scroll", onScroll, { passive: true } as AddEventListenerOptions);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // allocation
  const allocationWindowMs = 24 * 60 * 60 * 1000;

  const loadAllocLastAt = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ALLOC_LAST_AT);
      const n = raw ? Number(raw) : NaN;
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  };
  const saveAllocLastAt = (ts: number) => {
    try {
      localStorage.setItem(STORAGE_KEY_ALLOC_LAST_AT, String(ts));
    } catch {
      // ignore
    }
  };
  const allocationStatus = () => {
    const now = Date.now();
    const last = loadAllocLastAt();
    const ready = !last || now - last >= allocationWindowMs;
    const remaining = last ? Math.max(0, allocationWindowMs - (now - last)) : 0;
    const capHit = usdddAllocatedRef.current >= BASE_CAP;
    return { ready: ready && !capHit, remaining, capHit };
  };

  // guards
  const requirePass = () => {
    if (terminalPass) return true;
    emit("warn", "TERMINAL PASS REQUIRED");
    emit("info", "NEXT");
    emit("sys", `Next: ${C("register")}`);
    emit("sys", `Or: ${C("login")}`);
    return false;
  };
  const require2FAEnabled = () => {
    if (!requirePass()) return false;
    if (twoFaEnabled) return true;
    emit("warn", "SECURITY UNVERIFIED // 2FA REQUIRED for this action");
    emit("info", `Next: ${C("2fa")}`);
    return false;
  };
  const requireWallet = () => {
    if (!requirePass()) return false;
    if (activeWallet) return true;
    emit("warn", "WALLET NOT CONNECTED");
    emit("info", `Next: ${C("wallet connect")}`);
    return false;
  };
  const requireSponsorConsole = () => {
    if (!requirePass()) return false;
    if (consoleModeRef.current !== "SPONSOR") {
      emit("err", "This action requires SPONSOR console.");
      emit("info", `Next: ${C("sponsor")}`);
      return false;
    }
    return true;
  };


  const requireAdminUser = () => {
    if (!requirePass()) return false;
    if (!terminalPass || terminalPass.username !== "admin") {
      emit("err", "ACCESS DENIED // ADMIN CLEARANCE REQUIRED");
      return false;
    }
    return true;
  };

  // helpers
  const currentSponsorBox = () => {
    const id = sponsorActiveBoxIdRef.current;
    if (!id) return null;
    return campaignsRef.current.find((c) => c.id === id) ?? null;
  };
  const availableBalance = (c: Campaign) => Math.max(0, c.onChainBalance - c.claimedUnwithdrawn);

  /** --- Claim ledger helpers --- **/
  const recomputeTreasureBalancesForUser = (username: string | null, allClaims: TreasureClaim[]) => {
    if (!username) return {};
    const m: Record<string, number> = {};
    for (const cl of allClaims) {
      if (cl.user !== username) continue;
      if (cl.kind !== "TREASURE") continue;
      if (cl.status !== "CLAIMED") continue;
      m[cl.tokenSymbol] = (m[cl.tokenSymbol] ?? 0) + cl.amount;
    }
    return m;
  };

  useEffect(() => {
    setTreasureBalances(recomputeTreasureBalancesForUser(authedUser, claimsRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authedUser]);

  const listTreasureGroupsForUser = (username: string | null) => {
    if (!username) return [];
    const list = claimsRef.current.filter((c) => c.user === username && c.kind === "TREASURE" && c.status === "CLAIMED");
    const map = new Map<
      string,
      { amount: number; claimsCount: number; boxes: Set<string>; chainId: ChainId; symbol: string; tokenAddress: string }
    >();

    for (const cl of list) {
      const key = treasureGroupKey(cl.chainId, cl.tokenSymbol, cl.tokenAddress);
      const prev = map.get(key);
      if (!prev) {
        map.set(key, { amount: cl.amount, claimsCount: 1, boxes: new Set([cl.campaignId]), chainId: cl.chainId, symbol: cl.tokenSymbol, tokenAddress: cl.tokenAddress });
      } else {
        prev.amount += cl.amount;
        prev.claimsCount += 1;
        prev.boxes.add(cl.campaignId);
      }
    }

    const out: TreasureGroup[] = [];
    for (const [key, v2] of map.entries()) {
      out.push({ key, chainId: v2.chainId, symbol: v2.symbol, tokenAddress: v2.tokenAddress, amount: v2.amount, claimsCount: v2.claimsCount, boxesCount: v2.boxes.size });
    }
    out.sort((a, b) => b.amount - a.amount);
    return out;
  };

  const getTreasureGroupAmount = (username: string | null, key: string) => {
    const groups = listTreasureGroupsForUser(username);
    return groups.find((g) => g.key === key)?.amount ?? 0;
  };

  const withdrawTreasureFIFO = (username: string, groupKey: string, amount: number) => {
    const { chainId, symbol, tokenAddress } = parseTreasureGroupKey(groupKey);
    if (!chainId || !symbol) return { ok: false as const, err: "Invalid asset selection." };

    const now = Date.now();
    const tx = `0x${Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64)}`;

    const current = [...claimsRef.current];

    const eligible = current
      .filter((c) => c.user === username && c.status === "CLAIMED" && c.kind === "TREASURE" && c.chainId === chainId && c.tokenSymbol === symbol && c.tokenAddress === tokenAddress)
      .sort((a, b) => a.createdAt - b.createdAt);

    const total = eligible.reduce((a, c) => a + c.amount, 0);
    if (amount > total) return { ok: false as const, err: "Amount exceeds available." };

    let remaining = amount;

    const byCampaign: Record<string, number> = {};
    const updated: TreasureClaim[] = [];
    const eligibleIds = new Set(eligible.map((e) => e.id));

    const withdrawnClaimIds: string[] = [];

    for (const cl of current) {
      if (!eligibleIds.has(cl.id)) updated.push(cl);
    }

    for (const cl of eligible) {
      if (remaining <= 0) {
        updated.push(cl);
        continue;
      }
      const take = Math.min(remaining, cl.amount);
      remaining -= take;

      byCampaign[cl.campaignId] = (byCampaign[cl.campaignId] ?? 0) + take;

      if (take >= cl.amount - 1e-18) {
        withdrawnClaimIds.push(cl.id);
        updated.push({ ...cl, status: "WITHDRAWN", withdrawnAt: now });
      }
      else {
        const remainder = cl.amount - take;
        updated.push({ ...cl, amount: remainder, status: "CLAIMED" });
        const wid = uid("clmW");
        withdrawnClaimIds.push(wid);

        updated.push({ ...cl, id: wid, amount: take, status: "WITHDRAWN", withdrawnAt: now });

      }
    }

    setCampaigns((prev) =>
      prev.map((c) => {
        const dec = byCampaign[c.id] ?? 0;
        if (dec <= 0) return c;
        return {
          ...c,
          claimedUnwithdrawn: Math.max(0, c.claimedUnwithdrawn - dec),
          onChainBalance: Math.max(0, c.onChainBalance - dec),
          withdrawnTotal: c.withdrawnTotal + dec,
        };
      })
    );

    setClaims(updated);
    setTreasureBalances(recomputeTreasureBalancesForUser(username, updated));

    // persist withdrawals to DB (fire-and-forget)
    try {
      withdrawnClaimIds.forEach((claim_id) => {
        fetch("/api/claims/withdraw", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ claim_id }),
        }).catch(() => { });
      });
    } catch {
      // ignore
    }

    sendStat("withdraw", { chain: chainId, token_symbol: symbol, reward_amount: amount, box_id: null, priced: null });
    return { ok: true as const, tx, byCampaign };
  };

  // wallet ops
  const walletList = () => {
    if (!requirePass()) return;
    if (wallets.length === 0) {
      emit("warn", "No wallets saved.");
      emit("info", `Next: ${C("wallet connect")}`);
      return;
    }
    emit("info", "Wallets:");
    wallets.forEach((w, idx) => {
      const active = w.id === activeWalletId ? G("ACTIVE") : " ";
      emit("info", `• ${C(String(idx + 1))}) ${w.label} • ${chainLabel(w.chainId)} • ${shortAddr(w.address)} • ${active}`);
    });
    emit("info", `Commands: ${C("wallet switch")} • ${C("wallet forget")} • ${C("wallet connect")}`);
  };

  const walletStatus = () => {
    if (!requirePass()) return;
    if (!activeWallet) {
      emit("info", `Wallet: DISCONNECTED`);
      emit("info", "NEXT");
      emit("sys", `Next: ${C("wallet connect")}`);
      emit("sys", `Or: ${C("wallet list")}`);
      return;
    }
    emit("info", `Wallet: ${G("CONNECTED")} • ${G(activeWallet.label)} • ${G(chainLabel(activeWallet.chainId))}`);
    emit("info", `Address: ${activeWallet.address}`);
  };

  const walletDisconnect = () => {
    setActiveWalletId(null);
    emit("ok", "Wallet disconnected.");
  };

  const walletSwitchByIndex = (idx1: number) => {
    const idx = idx1 - 1;
    if (idx < 0 || idx >= wallets.length) {
      emit("warn", "Invalid wallet selection.");
      return;
    }
    const w = wallets[idx];
    setActiveWalletId(w.id);
    emit("ok", `Active wallet switched: ${G(w.label)} • ${G(chainLabel(w.chainId))} • ${G(shortAddr(w.address))}`);
  };

  const walletForgetByIndex = (idx1: number) => {
    const idx = idx1 - 1;
    if (idx < 0 || idx >= wallets.length) {
      emit("warn", "Invalid wallet selection.");
      return;
    }
    const w = wallets[idx];

    // remove from wallets list
    const remaining = wallets.filter((x) => x.id !== w.id);
    setWallets(remaining);
    if (w.id === activeWalletId) setActiveWalletId(remaining[0]?.id ?? null);

    // also remove registry ownership if it belongs to this user
    if (authedUser) {
      const reg = loadWalletRegistry();
      const key = walletRegistryKey(w.chainId, w.address);
      const owner = reg[key]?.owner;
      if (owner === authedUser) {
        delete reg[key];
        saveWalletRegistry(reg);
      }
    }

    emit("ok", `Wallet forgotten: ${w.label}`);
  };

  const walletConnectStart = () => {
    if (!requirePass()) return;
    emit("info", "Select chain to connect:");
    CHAINS.forEach((c, idx) => emit("info", `• ${C(String(idx + 1))}) ${c.label} (${c.standard})`));
    emit("info", `Reply with ${C("1")}–${C(String(CHAINS.length))}:`);
    setPrompt({ mode: "WALLET_CONNECT_CHAIN_PICK" });
  };

  const walletConnectAskLabel = (chainId: ChainId) => {
    emit("info", `Chain selected: ${chainLabel(chainId)}`);
    emit("info", "Enter wallet label (e.g. Main, Backup):");
    setPrompt({ mode: "WALLET_CONNECT_LABEL", walletTempChainId: chainId });
  };

  const walletConnectAskAddress = (chainId: ChainId, label: string) => {
    emit("info", `Label: ${label}`);
    emit("info", `Enter wallet address, or type ${C("AUTO")} to generate a mock address:`);
    setPrompt({ mode: "WALLET_CONNECT_ADDR", walletTempChainId: chainId, address: label });
  };

  const walletAddWithRegistry = (chainId: ChainId, label: string, address: string) => {
    if (!authedUser) {
      emit("err", "No active Terminal Pass.");
      return;
    }

    const addr = address.trim();
    const regKey = walletRegistryKey(chainId, addr);

    const reg = loadWalletRegistry();
    const existingOwner = reg[regKey]?.owner;

    // already registered to someone else
    if (existingOwner && existingOwner !== authedUser) {
      emit("err", "Wallet already registered to another Terminal Pass on this device.");
      emit("sys", `Registered owner: ${existingOwner}`);
      emit("info", "Use a different wallet address.");
      return;
    }

    // if already exists in current list, just activate it
    const existing = wallets.find((w) => walletRegistryKey(w.chainId, w.address) === regKey);
    if (existing) {
      setActiveWalletId(existing.id);
      emit("warn", "Wallet already exists. Set as ACTIVE.");
      emit("info", `Active: ${G(existing.label)} • ${G(chainLabel(existing.chainId))} • ${G(shortAddr(existing.address))}`);
      // ensure registry is set to this user (in case it was missing)
      reg[regKey] = { owner: authedUser, createdAt: reg[regKey]?.createdAt ?? Date.now() };
      saveWalletRegistry(reg);
      return;
    }

    // accept address format loosely (Phase Zero), but warn if EVM chain and address doesn't look EVM
    if (chainFamily(chainId) === "EVM" && !isLikelyEvmAddress(addr)) {
      emit("warn", "Address does not look like a standard EVM address (0x...). Continuing (Phase Zero).");
    }

    const w: WalletEntry = {
      id: uid("w").slice(-10),
      label: label.trim() || "Wallet",
      address: addr,
      chainId,
      createdAt: Date.now(),
    };

    setWallets((prev) => [w, ...prev]);
    setActiveWalletId(w.id);

    reg[regKey] = { owner: authedUser, createdAt: reg[regKey]?.createdAt ?? Date.now() };
    saveWalletRegistry(reg);

    emit("ok", "Wallet connected.");
    emit("info", `Active: ${G(w.label)} • ${G(chainLabel(w.chainId))} • ${G(shortAddr(w.address))}`);
  };

  // allocate / docs / clear / status
  const doAllocate = () => {
    if (!requirePass()) return;
    const now = Date.now();
    const last = loadAllocLastAt();
    const elapsed = last ? now - last : allocationWindowMs;
    const windows = Math.floor(elapsed / allocationWindowMs);

    if (windows <= 0) {
      const { remaining, capHit } = allocationStatus();
      if (capHit) emit("warn", `Allocation paused: cap reached (${BASE_CAP} USDDD).`);
      else emit("warn", `Allocation not ready. Next in ${fmtMs(remaining)}.`);
      return;
    }

    const credit = Math.min(DAILY_ALLOCATION, Math.max(0, BASE_CAP - usdddAllocatedRef.current));
    if (credit <= 0) {
      saveAllocLastAt(now);
      emit("warn", `Allocation paused: cap reached (${BASE_CAP} USDDD).`);
      return;
    }

    saveAllocLastAt(now);
    setUsdddAllocated((a) => Math.min(BASE_CAP, a + credit));
    emit("ok", `Allocation applied: +${credit.toFixed(2)} USDDD (Allocated)`);
  };

  const doDocs = () => {
    emit("info", "DOCS");
    emit("sys", "");
    emit("sys", `1) Genesis`);
    emit("sys", `2) Whitepaper`);
    emit("sys", `3) Monetary Policy`);
    emit("sys", `4) Glossary`);
    emit("sys", "");
    emit("info", "NEXT");
    emit("sys", "Type a number to open");
    emit("sys", `Or: ${C("cancel")}`);
    setPrompt({ mode: "DOCS_SELECT" });
  };

  const doStatus = () => {
    if (!terminalPass) {
      emit("err", "No active terminal pass found.");
      emit("info", `Next: ${C("register")}  •  or  •  ${C("login")}`);
      return;
    }

    const { ready, remaining, capHit } = allocationStatus();
    const digs = digHistoryRef.current.length;
    const finds = digHistoryRef.current.length;

    emit("sys", `MODE: ${consoleModeRef.current} • AUTO-SCROLL: ${autoScroll ? "ON" : "OFF"}`);
    emit("info", `Terminal Pass: ${authedUser ? G(authedUser) : "NONE"}`);
    emit("info", `Security: ${twoFaEnabled ? G("VERIFIED (2FA)") : `UNVERIFIED (type ${C("2fa")} to verify)`}`);

    if (!activeWallet) emit("info", `Wallet: DISCONNECTED`);
    else emit("info", `Wallet: ${G("CONNECTED")} • ${G(activeWallet.label)} • ${G(chainLabel(activeWallet.chainId))} • ${G(shortAddr(activeWallet.address))}`);

    emit("info", `USDDD: allocated=${GNum(usdddAllocatedRef.current, 2)} • acquired=${GNum(usdddAcquiredRef.current, 2)} • total=${GNum(usdddTotalRef.current, 2)}`);
    emit("info", `USDDD treasury: ${GNum(treasuryRef.current, 2)}`);

    emit("info", `Daily allocation: +${DAILY_ALLOCATION}/24h • cap ${BASE_CAP} • ${capHit ? "CAP REACHED" : ready ? G("AVAILABLE") : `in ${fmtMs(remaining)}`}`);
    emit("info", `Digs: ${digs > 0 ? G(String(digs)) : String(digs)} • Finds: ${finds > 0 ? G(String(finds)) : String(finds)}`);

    if (consoleModeRef.current === "SPONSOR") {
      const mine = campaignsRef.current.filter((c) => c.ownerUsername === (authedUser ?? ""));
      emit("info", `My Treasure Boxes: ${mine.length > 0 ? G(String(mine.length)) : String(mine.length)}`);
      const cur = currentSponsorBox();
      if (cur) emit("sys", `Active box: ${cur.id} • ${cur.tokenSymbol ?? "UNBOUND"} • ${chainLabel(cur.deployChainId)} • ${cur.status} • stage=${cur.stage}`);
      else emit("sys", `Active box: NONE (use ${C("use box")})`);
    }
  };

  const doClear = () => {
    setLines([]);
    setTimeout(() => emit("sys", "Screen cleared."), 0);
  };

  // boot
  useEffect(() => {
    if (!passLoaded) return;

    emit("sys", `DIGDUG.DO Terminal — ${BUILD_VERSION}`);
    emit("sys", "starting session (volatile)");
    emit("info", `Session ID: ${sessionId}`);

    sendStat("session_start");

    // Entry / load UX (intuitive)
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PASS);
      const hasPass = !!raw;
      if (hasPass) {
        const tp = JSON.parse(raw || "{}") as TerminalPass;
        const u = tp?.username ? String(tp.username) : "UNKNOWN";
        emit("sys", "");
        emit("ok", `Welcome back: ${G(u)}`);
        emit("info", "NEXT");
        emit("sys", `Next: ${C("user")}`);
        emit("sys", `Or: ${C("sponsor")}`);
      } else {
        emit("sys", "");
        emit("warn", "TERMINAL PASS REQUIRED");
        emit("info", "NEXT");
        emit("sys", `Next: ${C("register")}`);
        emit("sys", `Or: ${C("login")}`);
      }
    } catch {
      emit("sys", "");
      emit("warn", "TERMINAL PASS REQUIRED");
      emit("info", "NEXT");
      emit("sys", `Next: ${C("register")}`);
      emit("sys", `Or: ${C("login")}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passLoaded]);

  const printHelpContext = (m: ConsoleMode) => {
    if (m === "USER") {
      emit("info", "USER CONSOLE");
      emit("sys", "");
      emit("sys", "You are in USER mode.");
      emit("sys", "");
      emit("info", "DIGGING");
      emit("sys", "Fuel is spent to dig boxes.");
      emit("sys", "Rewards are discovered and withdrawn.");
      emit("sys", "");
      emit("info", "RULES");
      emit("sys", "Cooldowns may apply.");
      emit("sys", "Some boxes limit digs per user.");
      emit("sys", "");
      emit("info", "NEXT");
      emit("sys", `Next: ${C("dig")}`);
      emit("sys", `Or: ${C("docs")}`);
      return;
    }

    if (m === "SPONSOR") {
      emit("info", "SPONSOR CONSOLE");
      emit("sys", "");
      emit("sys", "You are in SPONSOR mode.");
      emit("sys", "");
      emit("info", "BOX FLOW");
      emit("sys", "Create a box.");
      emit("sys", "Fund it with tokens.");
      emit("sys", "Set cost and limits.");
      emit("sys", "Activate when ready.");
      emit("sys", "");
      emit("info", "RULES");
      emit("sys", "Boxes must be funded.");
      emit("sys", "Limits are enforced automatically.");
      emit("sys", "");
      emit("info", "NEXT");
      emit("sys", `Next: ${C("create box")}`);
      emit("sys", `Or: ${C("docs")}`);
      return;
    }

    emit("info", "ADMIN CONSOLE");
    emit("sys", "");
    emit("sys", "Admin commands only.");
  };

  const printCommands = (m: ConsoleMode) => {
    if (m === "USER") {
      emit("info", "USER COMMANDS");
      emit("sys", "");
      emit("sys", `${C("dig")}        ${C("rewards")}`);
      emit("sys", `${C("claim")}      ${C("acquire")}`);
      emit("sys", `${C("withdraw")}   ${C("wallet")}`);
      emit("sys", `${C("help")}       ${C("commands")}`);
      emit("sys", `${C("docs")}       ${C("gstats")}`);
      return;
    }

    if (m === "SPONSOR") {
      emit("info", "SPONSOR COMMANDS");
      emit("sys", "");
      emit("sys", `${C("create box")}   ${C("boxes")}`);
      emit("sys", `${C("activate")}     ${C("configure")}`);
      emit("sys", `${C("fund box")}     ${C("wallet")}`);
      emit("sys", `${C("help")}         ${C("commands")}`);
      emit("sys", `${C("docs")}         ${C("gstats")}`);
      return;
    }

    emit("info", "ADMIN COMMANDS");
    emit("sys", "");
    emit("sys", `${C("gstats")}   ${C("stats")}`);
    emit("sys", `${C("nuke")}     ${C("reset")}`);
  };

  const printConsoleStatus = (m: ConsoleMode) => {
    if (m === "USER") {
      emit("info", "USER CONSOLE");
      emit("sys", "");
      emit("sys", "You are ready to dig.");
      emit("sys", "");
      emit("info", "NEXT");
      emit("sys", `Next: ${C("dig")}`);
      emit("sys", `Or: ${C("help")}`);
      return;
    }
    if (m === "SPONSOR") {
      emit("info", "SPONSOR CONSOLE");
      emit("sys", "");
      emit("sys", "You can create and manage boxes.");
      emit("sys", "");
      emit("info", "NEXT");
      emit("sys", `Next: ${C("create box")}`);
      emit("sys", `Or: ${C("help")}`);
      return;
    }
    emit("info", "ADMIN CONSOLE");
    emit("sys", "");
    emit("sys", "Admin commands only.");
  };

  const switchConsole = (m: ConsoleMode) => {
    if (m === "ADMIN") {
      if (!terminalPass || terminalPass.username !== "admin") {
        emit("err", "ACCESS DENIED // ADMIN CLEARANCE REQUIRED");
        emit("info", "RETURNING TO: USER CONSOLE");
        setConsoleMode("USER");
        return;
      }
    }
    consoleModeRef.current = m;
    setConsoleMode(m);
    printConsoleStatus(m);
  };

  const start2FAEnroll = () => {
    if (!requirePass()) return;
    if (twoFaEnabled) {
      emit("ok", "2FA already enabled.");
      return;
    }
    const seed = `DD-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    emit("warn", "AUTHENTICATOR SETUP");
    emit("info", `2FA SEED (store offline): ${seed}`);
    emit("info", "Enter 6-digit code to confirm (mock):");
    setPrompt({ mode: "NEED_2FA", twoFaPurpose: "ENROLL", twoFaSeed: seed });
  };

  // Dig
  const startDig = () => {
    if (!requirePass()) return;
    emit("info", "Dig mode:");
    emit("info", `${C("1")}) Random treasure`);
    emit("info", `${C("2")}) Select a treasure`);
    emit("info", `Reply with ${C("1")} or ${C("2")}:`);
    setPrompt({ mode: "DIG_CHOICE" });
  };

  const limitLabel = (c: Campaign) => {
    if (c.maxDigsPerUser == null) return "limit=unlimited";
    if (c.maxDigsPerUser === 1) return "limit=one-time";
    return `limit=${c.maxDigsPerUser}/user`;
  };

  const cooldownLabel = (c: Campaign) => {
    return c.maxDigsPerUser === 1 ? "N/A" : `${c.cooldownHours}h`;
  };

  const listTreasures = () => {
    const active = campaignsRef.current.filter((c) => c.status === "ACTIVE" && c.stage === "CONFIGURED" && availableBalance(c) > 0);
    if (active.length === 0) {
      emit("warn", "No active treasures available.");
      return;
    }
    emit("info", "Treasures:");
    active.forEach((c, idx) => {
      const gateStr = (() => {
        if (!authedUser) return "READY";
        const gate = checkDigGate(authedUser, c);
        if (gate.ok) return "READY";
        if (gate.reason === "COOLDOWN") return `COOLDOWN ${fmtMs(gate.remainingMs ?? 0)}`;
        if (gate.reason === "LIMIT") return "LIMIT";
        return "LOCKED";
      })();

      emit("info", `• ${C(String(idx + 1))}) ${c.tokenSymbol ?? "TOKEN"} • ${chainLabel(c.deployChainId)} • cost=${c.costUSDDD}`);
      emit("sys", `   available=${availableBalance(c).toFixed(6)} • cooldown=${cooldownLabel(c)} • reward=${c.rewardMode} • ${limitLabel(c)} • status=${gateStr}`);
    });
    emit("info", `Reply with a treasure number (e.g. ${C("1")}):`);
    setPrompt({ mode: "DIG_SELECT" });
  };

  const digConfirmForCampaign = (c: Campaign) => {
    const sym = c.tokenSymbol ?? "TOKEN";
    const price = mockTokenUsdPrice(c, priceMockModeRef.current);
    const priceStr = price == null ? "N/A" : `$${fmtUsdPrice(price)}`;

    emit("info", `Selected: ${sym} on ${chainLabel(c.deployChainId)}`);

    emit("sys", "Summary:");
    emit("sys", `• Chain: ${chainLabel(c.deployChainId)}`);
    emit("sys", `• Cost: ${c.costUSDDD} USDDD (fuel)`);
    emit("sys", `• Reward: ${c.rewardMode}`);
    emit("sys", `• Limit: ${limitLabel(c)}`);
    emit("sys", `• Cooldown: ${cooldownLabel(c)}`);
    emit("sys", `• Available: ${availableBalance(c).toFixed(6)} ${sym}`);
    emit("sys", `• Token price: ${priceStr} (informational)`);

    // gate preview (no spending yet)
    if (authedUser) {
      const gate = checkDigGate(authedUser, c);
      if (!gate.ok && gate.reason === "COOLDOWN") {
        emit("warn", `Cooldown active: next dig in ${fmtMs(gate.remainingMs ?? 0)}.`);
      }
      if (!gate.ok && gate.reason === "LIMIT") {
        emit("warn", "Dig limit reached for this box (this user).");
      }
    }

    const m = c.meta ?? {};
    const metaLines: Array<{ k: string; v: string }> = [];
    if (m.website) metaLines.push({ k: "Website", v: m.website });
    if (m.x) metaLines.push({ k: "X", v: m.x });
    if (m.discord) metaLines.push({ k: "Discord", v: m.discord });
    if (m.telegram) metaLines.push({ k: "Telegram", v: m.telegram });
    if (m.cmc) metaLines.push({ k: "CMC", v: m.cmc });
    if (m.cg) metaLines.push({ k: "CoinGecko", v: m.cg });

    if (metaLines.length > 0) {
      emit("info", "Sponsor info (optional):");
      metaLines.forEach((l) => emit("sys", `• ${l.k}: ${l.v}`));
    } else {
      emit("sys", "Sponsor info: none provided.");
    }

    emit("sys", "Note: Withdrawals to wallet require 2FA. Network gas is paid by the user.");
    emit("sys", `Finalize dig? (${C("Y")}/${C("N")})`);
    setPrompt({ mode: "DIG_CONFIRM", selectedCampaignId: c.id });
  };

  const computeReward = (c: Campaign) => {
    const avail = availableBalance(c);
    if (avail <= 0) return 0;

    let r = MIN_YIELD_FLOOR;

    if (c.rewardMode === "FIXED") {
      r = Math.max(MIN_YIELD_FLOOR, c.fixedReward);
    } else {
      const min = Math.max(MIN_YIELD_FLOOR, Math.min(c.randomMin, c.randomMax));
      const max = Math.max(min, c.randomMax);
      r = min + Math.random() * (max - min);
    }

    r = Math.min(r, avail);
    return Math.max(MIN_YIELD_FLOOR, r);
  };

  const digGateKey = (username: string, boxId: string) => `${username}|${boxId}`;

  const checkDigGate = (username: string, c: Campaign) => {
    const key = digGateKey(username, c.id);
    const state = digGateRef.current[key] ?? { count: 0, lastAt: null };

    // limit gate
    if (c.maxDigsPerUser != null && state.count >= c.maxDigsPerUser) {
      return { ok: false as const, reason: "LIMIT", key, state };
    }

    // cooldown gate (only relevant if they've dug at least once)
    if (state.lastAt != null) {
      const cdMs = c.cooldownHours * 3600 * 1000;
      const elapsed = Date.now() - state.lastAt;

      // If limit=1, cooldown irrelevant; otherwise enforce cooldown
      const needsCooldown = c.maxDigsPerUser == null || c.maxDigsPerUser > 1;
      if (needsCooldown && elapsed < cdMs) {
        return { ok: false as const, reason: "COOLDOWN", key, state, remainingMs: cdMs - elapsed };
      }
    }

    return { ok: true as const, key, state };
  };

  const applyDigGate = (username: string, boxId: string) => {
    const key = digGateKey(username, boxId);
    setDigGate((prev) => {
      const cur = prev[key] ?? { count: 0, lastAt: null };
      return { ...prev, [key]: { count: cur.count + 1, lastAt: Date.now() } };
    });
  };

  const performDig = async (campaign: Campaign) => {
    emit("sys", "dig: connecting...");
    emit("sys", "dig: verifying box...");
    emit("sys", "dig: generating entropy...");
    emit("sys", "[##########] 100%");

    const rewardAmt = computeReward(campaign);
    const sym = campaign.tokenSymbol ?? "TOKEN";
    const tier = findTier(campaign, rewardAmt);

    // cost-anchored USD value (mock economics)
    const usdValue = sampleUsdTarget(campaign.costUSDDD);

    // derived snapshot price for this dig
    const usdPrice =
      rewardAmt > 0
        ? clamp(usdValue / rewardAmt, 0.000001, 1000)
        : null;


    // reserve on box ledger (claimed until withdrawn)
    setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? { ...c, claimedUnwithdrawn: c.claimedUnwithdrawn + rewardAmt } : c)));

    // claim record for correct withdrawals
    if (authedUser) {
      const newClaim: TreasureClaim = {
        id: uid("clm"),
        user: authedUser,
        kind: "TREASURE",
        campaignId: campaign.id,
        chainId: campaign.deployChainId,
        tokenAddress: campaign.tokenAddress ?? "UNBOUND",
        tokenSymbol: sym,
        amount: rewardAmt,
        status: "CLAIMED",
        createdAt: Date.now(),
        createdAtStr: nowLocalDateTime(),
      };
      // persist claim to DB (fire-and-forget)
      try {
        fetch("/api/claims/add", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            username: authedUser,
            box_id: campaign.id,
            chain_id: campaign.deployChainId,
            token_address: campaign.tokenAddress ?? "UNBOUND",
            token_symbol: sym,
            amount: rewardAmt,
          }),
        }).catch(() => { });
      } catch {
        // ignore
      }
      setClaims((prev) => {
        const next = [...prev, newClaim];
        setTreasureBalances(recomputeTreasureBalancesForUser(authedUser, next));
        return next;
      });
    }

    // simple holdings
    setTreasureBalances((b) => ({ ...b, [sym]: (b[sym] ?? 0) + rewardAmt }));

    const record: DigRecord = {
      id: uid("dig"),
      at: nowLocalDateTime(),
      campaignId: campaign.id,
      label: `${sym}/${campaign.deployChainId}`,
      spentUSDDD: campaign.costUSDDD,
      rewardSymbol: sym,
      rewardAmount: rewardAmt,
      rewardMode: campaign.rewardMode,
      rewardUsdPrice: usdPrice,
      rewardUsdValue: usdValue,
    };
    setDigHistory((h) => [...h, record]);

    sendStat("dig_success", {
      box_id: campaign.id,
      chain: campaign.deployChainId,
      token_symbol: sym,
      usddd_cost: campaign.costUSDDD,
      reward_amount: rewardAmt,
      priced: usdPrice != null,
      reward_price_usd: usdPrice,
      reward_value_usd: usdValue,
    });

    // Golden Find trigger (fire-and-forget, ASCII broadcast, max 5/day)
    try {
      fetch("/api/golden/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          usd_value: usdValue,            // numeric
          token: sym,                     // token symbol
          chain: campaign.deployChainId,  // ETH/BNB/SOL/ARB/BASE
          username: authedUser,
        }),
      }).catch(() => { });
    } catch {
      // ignore
    }

    if (usdValue != null) emit("ok", `${tier} — +${rewardAmt.toFixed(6)} ${sym} (~$${fmtUsdValue(usdValue)})`);
    else emit("ok", `${tier} — +${rewardAmt.toFixed(6)} ${sym}`);
    // UX hint: golden finds are decided server-side + announced in Telegram
    // UX hint: golden finds are decided server-side + announced in Telegram
    if (usdValue != null && usdValue >= 5 && usdValue <= 20) {
      emit(
        "info",
        "This dig may qualify as a GOLDEN FIND. Check Telegram for the claim code: https://t.me/digdugdo"
      );
    }

  };

  const executeDig = async (campaign: Campaign) => {
    if (!requirePass()) return;

    sendStat("dig_attempt", { box_id: campaign.id, chain: campaign.deployChainId, token_symbol: campaign.tokenSymbol ?? null, usddd_cost: campaign.costUSDDD });

    if (campaign.status !== "ACTIVE" || campaign.stage !== "CONFIGURED") {
      emit("warn", "Treasure Box not active/configured.");
      return;
    }
    if (availableBalance(campaign) <= 0) {
      emit("warn", "Treasure Box depleted (available = 0).");
      return;
    }

    // dig gate (per Terminal Pass)
    if (authedUser) {
      const gate = checkDigGate(authedUser, campaign);
      if (!gate.ok) {
        if (gate.reason === "LIMIT") {
          emit("warn", "DIG LIMIT REACHED");
          emit("sys", "This Treasure Box has a per-user dig limit.");
          return;
        }
        if (gate.reason === "COOLDOWN") {
          emit("warn", "COOLDOWN ACTIVE");
          emit("sys", `Try again in ${fmtMs(gate.remainingMs ?? 0)}.`);
          return;
        }
      }
    }

    if (usdddTotalRef.current < campaign.costUSDDD) {
      emit("warn", `Balance insufficient (need ${campaign.costUSDDD.toFixed(2)} USDDD).`);
      return;
    }

    // spend priority: Allocated -> Acquired
    const cost = campaign.costUSDDD;
    const allocNow = usdddAllocatedRef.current;
    const takeAllocated = Math.min(allocNow, cost);
    const takeAcquired = Math.max(0, cost - takeAllocated);

    setUsdddAllocated(Math.max(0, allocNow - takeAllocated));
    setUsdddAcquired((p) => Math.max(0, p - takeAcquired));
    setTreasuryUSDDD((t) => t + cost);

    // apply dig gate after spending succeeds
    if (authedUser) applyDigGate(authedUser, campaign.id);

    await performDig(campaign);
  };

  // Withdraw
  const openWithdraw = () => {
    if (!requirePass()) return;
    emit("info", "Withdraw options:");
    emit("sys", "Withdrawals send to your connected wallet by default. Network gas is paid by the user.");
    emit("info", `${C("1")}) USDDD (acquired only)`);
    emit("info", `${C("2")}) Treasure`);
    emit("info", `Reply with ${C("1")} or ${C("2")}:`);
    setPrompt({ mode: "WITHDRAW_PICK" });
  };

  const openWithdrawUSDDD = () => {
    if (!require2FAEnabled()) return;
    if (!requireWallet()) return;
    emit("sys", "Withdraw USDDD selected.");
    emit("info", `Available (Acquired): ${usdddAcquiredRef.current.toFixed(2)} USDDD`);
    emit("sys", `Note: Allocated (${usdddAllocatedRef.current.toFixed(2)}) is non-withdrawable.`);
    emit("info", "Enter amount to withdraw:");
    setPrompt({ mode: "WITHDRAW_USDDD_AMOUNT", withdrawKind: "USDDD" });
  };

  const openWithdrawTreasure = () => {
    if (!require2FAEnabled()) return;
    if (!requireWallet()) return;

    const groups = listTreasureGroupsForUser(authedUser);
    if (groups.length === 0) {
      emit("warn", "No treasure assets available to withdraw.");
      return;
    }

    emit("info", "Available treasure (grouped):");
    groups.forEach((g, idx) => {
      emit("info", `• ${C(String(idx + 1))}) ${g.symbol} • ${chainLabel(g.chainId)} • ${g.amount.toFixed(6)}`);
      emit("sys", `   token=${shortAddr(g.tokenAddress)} • claims=${g.claimsCount} • boxes=${g.boxesCount}`);
    });

    emit("info", `Reply with group number (e.g. ${C("1")}):`);
    setPrompt({ mode: "WITHDRAW_TREASURE_PICK", withdrawKind: "TREASURE" });
  };

  const withdrawGasNotice = (assetChainId: ChainId) => {
    const walletFam = activeWallet ? chainFamily(activeWallet.chainId) : "EVM";
    const assetFam = chainFamily(assetChainId);
    emit("warn", "Network gas is paid by the user (external fee).");
    emit("sys", `Asset chain: ${chainLabel(assetChainId)}`);
    if (activeWallet) emit("sys", `Destination wallet: ${chainLabel(activeWallet.chainId)} • type=${walletFam}`);
    if (assetFam !== walletFam) {
      emit("warn", "Chain mismatch (Phase Zero, non-strict). Ensure your destination supports the asset chain.");
    }
  };

  // Sponsor flow
  const startSponsorCreateBox = () => {
    if (!requireSponsorConsole()) return;
    if (!require2FAEnabled()) return;

    emit("info", "Select chain for Treasure Box deployment:");
    CHAINS.forEach((c, idx) => emit("info", `• ${C(String(idx + 1))}) ${c.label} (${c.standard})`));
    emit("info", `Reply with ${C("1")}–${C(String(CHAINS.length))}:`);
    setPrompt({ mode: "SP_CREATE_CHAIN_PICK" });
  };

  const mockNativeFeeForChain = (chainId: ChainId) => {
    // simple fixed-ish
    if (chainId === "SOL") return { sym: "SOL", amt: 0.015 };
    if (chainId === "ARB") return { sym: "ETH", amt: 0.0025 };
    if (chainId === "BASE") return { sym: "ETH", amt: 0.002 };
    if (chainId === "BNB") return { sym: "BNB", amt: 0.01 };
    return { sym: "ETH", amt: 0.004 };
  };

  const sponsorDeployBox = (chainId: ChainId) => {
    const fee = mockNativeFeeForChain(chainId);
    if (!requireWallet()) return;

    const id = uid("box").slice(-8);
    const newBox: Campaign = {
      id,
      ownerUsername: authedUser ?? "unknown",
      deployChainId: chainId,
      deployFeeNativeSymbol: fee.sym,
      deployFeeNativeAmount: fee.amt,
      tokenAddress: undefined,
      tokenSymbol: undefined,
      tokenDecimals: undefined,
      tokenChainId: undefined,
      onChainBalance: 0,
      claimedUnwithdrawn: 0,
      depositedTotal: 0,
      withdrawnTotal: 0,
      meta: {},
      costUSDDD: 1,
      cooldownHours: 24,
      rewardMode: "RANDOM",
      fixedReward: 0.1,
      randomMin: 0.01,
      randomMax: 0.25,
      maxDigsPerUser: null, // unlimited by default
      stage: "DEPLOYED_EMPTY",
      status: "INACTIVE",
      createdAt: Date.now(),
    };

    setCampaigns((prev) => [newBox, ...prev]);
    setSponsorActiveBoxId(newBox.id);

    sendStat("box_create", { box_id: newBox.id, chain: chainId });

    emit("sys", `Deployment fee (native gas): ${fee.amt} ${fee.sym}`);
    emit("sys", "DIGDUG.DO does not custody funds.");
    emit("ok", `Deployment complete (mock): ${chainLabel(chainId)} Treasure Box exists (empty).`);
    emit("info", `Active box set: id=${newBox.id}`);
    emit("info", `Next: ${C("bind token")}`);
  };

  const mockDeriveTokenMeta = (chainId: ChainId, addr: string) => {
    const decimals = chainFamily(chainId) === "SOL" ? 9 : 18;
    const lower = addr.trim().toLowerCase();
    const tail = lower.replace(/[^a-z0-9]/g, "").slice(-4).toUpperCase() || "TKN";
    const prefix = chainFamily(chainId) === "SOL" ? "S" : "T";
    const symbol = `${prefix}${tail}`.slice(0, 5);
    return { symbol, decimals };
  };

  const sponsorBindTokenApply = (addr: string) => {
    const c = currentSponsorBox();
    if (!c) return;

    if (c.tokenAddress) {
      emit("err", "Token already bound. Binding is permanent.");
      return;
    }

    const { symbol, decimals } = mockDeriveTokenMeta(c.deployChainId, addr);

    setCampaigns((prev) =>
      prev.map((x) =>
        x.id === c.id
          ? { ...x, tokenAddress: addr, tokenSymbol: symbol, tokenDecimals: decimals, tokenChainId: c.deployChainId, stage: "TOKEN_BOUND" }
          : x
      )
    );

    emit("ok", "Token bound to Treasure Box (mock).");
    emit("info", `Token: ${symbol} • decimals=${decimals} • chain=${chainLabel(c.deployChainId)}`);
    emit("warn", "Binding is permanent: only this token can be deposited.");
    emit("info", `Next: ${C("deposit")}`);
  };

  const sponsorDeposit = () => {
    if (!requireSponsorConsole()) return;
    if (!require2FAEnabled()) return;
    if (!requireWallet()) return;
    const c = currentSponsorBox();
    if (!c) {
      emit("warn", "No active box selected.");
      return;
    }
    if (!c.tokenAddress || !c.tokenSymbol) {
      emit("warn", "Token not bound yet.");
      emit("info", `Next: ${C("bind token")}`);
      return;
    }

    const simulatedDeposit = Math.round((5000 + Math.random() * 15000) * 100) / 100;

    setCampaigns((prev) =>
      prev.map((x) =>
        x.id === c.id
          ? {
            ...x,
            onChainBalance: x.onChainBalance + simulatedDeposit,
            depositedTotal: x.depositedTotal + simulatedDeposit,
            stage: x.stage === "TOKEN_BOUND" || x.stage === "DEPLOYED_EMPTY" ? "FUNDED" : x.stage,
          }
          : x
      )
    );

    emit("ok", `Deposit received (mock): +${simulatedDeposit.toFixed(2)} ${c.tokenSymbol}`);
    emit("info", `Next: ${C("configure")}  •  then  •  ${C("activate")}`);
  };

  const sponsorListMyBoxes = () => {
    if (!requireSponsorConsole()) return;
    const mine = campaignsRef.current.filter((c) => c.ownerUsername === (authedUser ?? ""));
    if (mine.length === 0) {
      emit("warn", "No sponsor boxes found.");
      emit("info", `Next: ${C("create box")}`);
      return;
    }
    emit("info", "My boxes:");
    mine.forEach((c, idx) => {
      const ctx = c.id === sponsorActiveBoxIdRef.current ? G("ACTIVE_CTX") : " ";
      emit("info", `• ${C(String(idx + 1))}) id=${c.id} • ${c.tokenSymbol ?? "UNBOUND"} • ${chainLabel(c.deployChainId)} • ${c.status}/${c.stage} • ${ctx}`);
      emit("sys", `   onchain=${c.onChainBalance.toFixed(6)} • claimed=${c.claimedUnwithdrawn.toFixed(6)} • available=${availableBalance(c).toFixed(6)} • cost=${c.costUSDDD} • cooldown=${cooldownLabel(c)} • ${limitLabel(c)}`);
    });
    emit("info", `Tip: ${C("use box")} to set active context.`);
  };

  const sponsorUseBoxPrompt = () => {
    if (!requireSponsorConsole()) return;
    const mine = campaignsRef.current.filter((c) => c.ownerUsername === (authedUser ?? ""));
    if (mine.length === 0) {
      emit("warn", "No sponsor boxes found.");
      return;
    }
    emit("info", "Select a box to use:");
    mine.forEach((c, idx) => emit("info", `• ${C(String(idx + 1))}) id=${c.id} • ${c.tokenSymbol ?? "UNBOUND"} • ${chainLabel(c.deployChainId)} • ${c.status}/${c.stage}`));
    setPrompt({ mode: "SP_BOX_PICK_FOR_USE", spPickList: mine.map((x) => x.id) });
  };

  const sponsorBoxSummary = (c: Campaign) => {
    emit("info", `Box: id=${c.id} • chain=${chainLabel(c.deployChainId)} • status=${c.status} • stage=${c.stage}`);
    if (!c.tokenAddress) {
      emit("warn", "Token: UNBOUND");
      emit("info", `Next: ${C("bind token")}`);
      return;
    }
    emit("sys", `Token: ${c.tokenSymbol} • decimals=${c.tokenDecimals} • address=${c.tokenAddress}`);
    emit("sys", `On-chain: ${c.onChainBalance.toFixed(6)} • Claimed: ${c.claimedUnwithdrawn.toFixed(6)} • Available: ${availableBalance(c).toFixed(6)}`);
    emit("sys", `Cost: ${c.costUSDDD} • Cooldown: ${cooldownLabel(c)} • Reward: ${c.rewardMode} • ${limitLabel(c)}`);
    emit("info", `Commands: ${C("deposit")} • ${C("configure")} • ${C("activate")} • ${C("deactivate")} • ${C("box stats")}`);
  };

  const sponsorBindTokenStart = () => {
    if (!requireSponsorConsole()) return;
    if (!require2FAEnabled()) return;
    if (!requireWallet()) return;
    const c = currentSponsorBox();
    if (!c) {
      emit("warn", "No active box selected.");
      emit("info", `Next: ${C("use box")}`);
      return;
    }
    if (c.tokenAddress) {
      emit("err", "Token already bound. Binding is permanent.");
      return;
    }
    emit("info", "Enter token contract address to be deposited:");
    setPrompt({ mode: "SP_TOKEN_ADDRESS" });
  };

  const sponsorConfigureStart = () => {
    if (!requireSponsorConsole()) return;
    if (!require2FAEnabled()) return;
    if (!requireWallet()) return;
    const c = currentSponsorBox();
    if (!c) {
      emit("warn", "No active box selected.");
      return;
    }
    if (!c.tokenAddress || !c.tokenSymbol) {
      emit("warn", "Token not bound.");
      emit("info", `Next: ${C("bind token")}`);
      return;
    }
    if (c.onChainBalance <= 0) {
      emit("warn", "Box has no deposited balance.");
      emit("info", `Next: ${C("deposit")}`);
      return;
    }
    emit("info", "Configure box (bounded):");
    emit("info", `• ${C("1")}) Set cost`);
    emit("info", `• ${C("2")}) Set reward`);
    emit("info", `• ${C("3")}) Set limit`);

    if (c.maxDigsPerUser === 1) {
      emit("sys", "• Cooldown: N/A (one-time box)");
    } else {
      emit("info", `• ${C("4")}) Set cooldown`);
    }

    emit("info", `• ${C("5")}) Activate box`);
    emit("info", `Reply with ${C("1")}–${C("5")}:`);
    setPrompt({ mode: "SP_CONFIG_PICK" });
    return;
  };


  const sponsorMetaMenu = (c: Campaign) => {
    const m = c.meta ?? {};
    const show = (v2?: string) => (v2 && v2.trim().length > 0 ? v2 : "N/A");

    emit("info", "Sponsor metadata (optional):");
    emit("sys", "Displayed to users on the pre-dig screen for due diligence (DD).");
    emit("sys", "Fields are set-once (immutable).");

    emit("info", `• ${C("1")}) Website: ${show(m.website)}`);
    emit("info", `• ${C("2")}) X: ${show(m.x)}`);
    emit("info", `• ${C("3")}) Discord: ${show(m.discord)}`);
    emit("info", `• ${C("4")}) Telegram: ${show(m.telegram)}`);
    emit("info", `• ${C("5")}) CMC: ${show(m.cmc)}`);
    emit("info", `• ${C("6")}) CoinGecko: ${show(m.cg)}`);
    emit("info", `• ${C("7")}) Done`);

    emit("info", `Reply with ${C("1")}–${C("7")}:`);
    setPrompt({ mode: "SP_META_PICK" });
  };

  const sponsorSetMetaStart = () => {
    if (!requireSponsorConsole()) return;
    if (!require2FAEnabled()) return;
    if (!requireWallet()) return;
    const c = currentSponsorBox();
    if (!c) {
      emit("warn", "No active box selected.");
      emit("info", `Next: ${C("use box")}`);
      return;
    }
    if (c.status === "ACTIVE") {
      emit("warn", "Metadata is locked once a box is ACTIVE.");
      return;
    }
    sponsorMetaMenu(c);
  };

  const sponsorActivate = () => {
    if (!requireSponsorConsole()) return;
    if (!require2FAEnabled()) return;
    if (!requireWallet()) return;
    const c = currentSponsorBox();
    if (!c) return;
    if (!c.tokenAddress || !c.tokenSymbol) {
      emit("warn", "Token not bound.");
      return;
    }
    if (c.onChainBalance <= 0) {
      emit("warn", "No deposited balance.");
      return;
    }

    const configuredOk =
      c.costUSDDD >= COST_MIN &&
      c.cooldownHours >= COOLDOWN_MIN_H &&
      (c.rewardMode === "FIXED" ? c.fixedReward > 0 : c.randomMin > 0 && c.randomMax >= c.randomMin);

    if (!configuredOk) {
      emit("warn", "Box configuration incomplete.");
      emit("info", `Next: ${C("set cost")} • ${C("set cooldown")} • ${C("set reward")}`);
      return;
    }

    setCampaigns((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: "ACTIVE", stage: "CONFIGURED" } : x)));
    sendStat("box_activate", { box_id: c.id, chain: c.deployChainId, token_symbol: c.tokenSymbol ?? null });
    emit("ok", "Box activated.");
  };

  const sponsorDeactivate = () => {
    if (!requireSponsorConsole()) return;
    if (!require2FAEnabled()) return;
    if (!requireWallet()) return;
    const c = currentSponsorBox();
    if (!c) return;
    setCampaigns((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: "INACTIVE" } : x)));
    emit("ok", "Box deactivated.");
  };

  const sponsorBoxStats = () => {
    if (!requireSponsorConsole()) return;
    const c = currentSponsorBox();
    if (!c) {
      emit("warn", "No active box selected.");
      return;
    }
    const related = digHistoryRef.current.filter((d) => d.campaignId === c.id);
    const totalClaims = related.length;
    const totalPaidOut = related.reduce((a, d) => a + d.rewardAmount, 0);
    const totalUSDDDIn = related.reduce((a, d) => a + d.spentUSDDD, 0);

    emit("info", "Sponsor Box Stats:");
    emit("info", `• Box id: ${c.id}`);
    emit("info", `• Token: ${c.tokenSymbol ?? "UNBOUND"} • Chain: ${chainLabel(c.deployChainId)}`);
    emit("info", `• Deposited total: ${c.depositedTotal.toFixed(6)}`);
    emit("info", `• Withdrawn total: ${c.withdrawnTotal.toFixed(6)}`);
    emit("info", `• Claimed (unwithdrawn): ${c.claimedUnwithdrawn.toFixed(6)}`);
    emit("info", `• On-chain balance (sim): ${c.onChainBalance.toFixed(6)}`);
    emit("info", `• Available: ${availableBalance(c).toFixed(6)}`);
    emit("info", `• Dig limit: ${limitLabel(c)}`);
    emit("info", `• Total claims: ${totalClaims}`);
    emit("info", `• Token paid out: ${totalPaidOut.toFixed(6)}`);
    emit("info", `• USDDD spent into box: ${totalUSDDDIn.toFixed(2)}`);
  };

  const sponsorClaimHistory = () => {
    if (!requireSponsorConsole()) return;
    const c = currentSponsorBox();
    if (!c) {
      emit("warn", "No active box selected.");
      return;
    }
    const related = [...digHistoryRef.current.filter((d) => d.campaignId === c.id)].slice(-30).reverse();
    emit("info", `Claim history (last ${related.length}):`);
    if (related.length === 0) {
      emit("info", "No claims yet.");
      return;
    }
    related.forEach((r) => emit("info", `• ${r.at} • +${r.rewardAmount.toFixed(6)} ${r.rewardSymbol} • cost=${r.spentUSDDD} USDDD • mode=${r.rewardMode}`));
  };

  // Admin
  const adminResetStats = () => {
    setTreasuryUSDDD(0);
    try {
      localStorage.removeItem(STORAGE_KEY_ALLOC_LAST_AT);
    } catch { }
    emit("ok", "ADMIN: STATS RESET COMPLETE");
  };

  const adminResetAll = () => {
    setUsdddAllocated(10);
    setUsdddAcquired(0);
    setTreasuryUSDDD(0);
    try {
      localStorage.removeItem(STORAGE_KEY_ALLOC_LAST_AT);
    } catch { }
    setClaims([]);
    setTreasureBalances({});
    setDigHistory([]);
    setCampaigns(seedSponsorCampaigns());
    setSponsorActiveBoxId(null);
    setDigGate({});
    emit("ok", "ADMIN: FULL RESET COMPLETE");
  };

  const nukeLocalState = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_PASS);
      localStorage.removeItem(STORAGE_KEY_ALLOC_LAST_AT);
      localStorage.removeItem(STORAGE_KEY_WALLETS_V2);
      localStorage.removeItem(STORAGE_KEY_WALLET_REGISTRY);
      localStorage.removeItem(STORAGE_KEY_DIG_GATE);
    } catch { }
    setTerminalPass(null);
    setWallets([]);
    setActiveWalletId(null);
    setUsdddAllocated(10);
    setUsdddAcquired(0);
    setTreasuryUSDDD(0);
    setClaims([]);
    setTreasureBalances({});
    setDigHistory([]);
    setCampaigns(seedSponsorCampaigns());
    setSponsorActiveBoxId(null);
    setDigGate({});
    setPrompt({ mode: "IDLE" });
    setLines([]);
    setTimeout(() => {
      emit("sys", "SYSTEM RESET COMPLETE");
      emit("info", `Next: ${C("register")}`);
    }, 50);
  };

  // Rewards/history
  const showRewards = () => {
    if (!requirePass()) return;
    const items = Object.entries(treasureBalancesRef.current).filter(([, a]) => a > 0);
    if (items.length === 0) return void emit("warn", "No rewards yet.");
    emit("info", "Rewards / Holdings:");
    items.forEach(([sym, amt]) => emit("info", `• ${sym}: ${amt.toFixed(6)}`));

    const groups = listTreasureGroupsForUser(authedUser);
    if (groups.length > 0) {
      emit("sys", "Withdraw groups:");
      groups.slice(0, 10).forEach((g) => emit("sys", `• ${g.symbol} • ${chainLabel(g.chainId)} • ${g.amount.toFixed(6)} • token=${shortAddr(g.tokenAddress)}`));
    }
  };

  const showDigHistory = () => {
    if (!requirePass()) return;
    const recent = [...digHistoryRef.current].slice(-30).reverse();
    emit("info", `Dig history (last ${recent.length}):`);
    if (recent.length === 0) return void emit("info", "No digs yet.");
    recent.forEach((r) => {
      const v2 = r.rewardUsdValue != null ? ` (~$${fmtUsdValue(r.rewardUsdValue)})` : "";
      emit("info", `• ${r.at} • ${r.label} • -${r.spentUSDDD} USDDD • ${r.rewardMode} +${r.rewardAmount.toFixed(6)} ${r.rewardSymbol}${v2}`);
    });
  };

  // COMMAND ROUTER
  const runCommand = (raw: string) => {
    const v = normalizeInput(raw);
    if (!v) return;
    const low = v.toLowerCase();

    emit("cmd", `> ${v}`);

    // UI
    if (low === "menu" || low === "m") return void setPanelOpen((o) => !o);
    if (low === "clear" || low === "cls") return void doClear();
    if (low === "status") return void doStatus();
    if (low === "docs") return void doDocs();
    if (low === "build") return void emit("sys", `BUILD: ${BUILD_VERSION}`);
    if (low === "gstats") return void fetchAndPrintGlobalPulse();

    // mock price mode (admin/operator)
    if (low.startsWith("price mock")) {
      if (!requireAdminUser()) return;
      const parts = low.split(/\s+/).filter(Boolean);

      // forms:
      //  - price mock
      //  - price mock random|always|never
      //  - price mock mode random|always|never
      const pick = (parts[2] === "mode" ? parts[3] : parts[2])?.toUpperCase();

      if (!pick) {
        emit("info", `Price mock mode: ${G(priceMockModeRef.current)}`);
        emit("sys", `Set: ${C("price mock random")} • ${C("price mock always")} • ${C("price mock never")}`);
        return;
      }

      if (pick !== "RANDOM" && pick !== "ALWAYS" && pick !== "NEVER") {
        emit("warn", "Invalid mode. Use: RANDOM / ALWAYS / NEVER");
        return;
      }

      setPriceMockMode(pick as PriceMockMode);
      emit("ok", `Price mock mode set: ${G(pick)}`);
      return;
    }

    // help
    if (low === "help" || low === "h") {
      printHelpContext(consoleModeRef.current);
      return;
    }
    if (low === "commands" || low === "cmds") return void printCommands(consoleModeRef.current);

    // nuke (admin-only)
    if (low === "nuke" || low === "wipe") {
      if (!requireAdminUser()) return;
      emit("warn", "⚠️  DEV COMMAND: NUKE (erases local state)");
      emit("info", `Type ${C("YES")} to confirm or ${C("NO")} to cancel.`);
      setPrompt({ mode: "CONFIRM_NUKE" });
      return;
    }

    // console switch
    if (low === "user") return void switchConsole("USER");
    if (low === "sponsor") return void switchConsole("SPONSOR");
    if (low === "admin") return void switchConsole("ADMIN");

    // auth
    if (low === "whoami") {
      if (!terminalPass) emit("warn", "TERMINAL PASS REQUIRED");
      else emit("ok", `Terminal Pass: ${G(terminalPass.username)}`);
      return;
    }
    // ✅ telegram verify (links TG user to this Terminal Pass)
    if (low === "verify" || low.startsWith("verify ")) {
      if (!requirePass()) return;

      const parts = v.split(/\s+/).filter(Boolean);
      const code = (parts[1] ?? "").trim();

      if (!code) {
        emit("warn", "Missing verification code.");
        emit("info", "Usage:");
        emit("sys", `Type: ${C("verify DG-XXXX")}`);
        emit("sys", "Get a code by DM-ing the bot: /verify");
        return;
      }

      emit("sys", "Verifying Telegram code…");

      void (async () => {
        try {
          const r = await fetch("/api/telegram/verify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              username: terminalPass!.username,
              code,
            }),
          });

          const data = (await r.json()) as any;

          if (!r.ok || !data?.ok) {
            const err = data?.error ?? `verify_failed_http_${r.status}`;
            if (err === "code_expired") emit("err", "Verification code expired. DM the bot /verify again.");
            else if (err === "code_already_used") emit("err", "Verification code already used. DM the bot /verify again.");
            else if (err === "code_not_found") emit("err", "Verification code not found. Check the code and try again.");
            else if (err === "terminal_user_not_found") emit("err", "Terminal user not found on server. Please re-login and try again.");
            else emit("err", `Verification failed: ${err}`);
            return;
          }

          emit("ok", `Telegram verification linked ✅ (${G(data.code)})`);
          emit("sys", `tg_user_id=${data.tg_user_id}`);
          return;
        } catch (e: any) {
          emit("err", `Verification failed (network/server): ${e?.message ?? "Unknown error"}`);
        }
      })();

      return;
    }

    if (low === "logout") {
      setTerminalPass(null);
      emit("ok", "Logged out.");
      emit("sys", "");
      emit("warn", "TERMINAL PASS REQUIRED");
      emit("info", "NEXT");
      emit("sys", `Next: ${C("register")}`);
      emit("sys", `Or: ${C("login")}`);
      return;
    }
    if (low === "register") {
      if (terminalPass) return emit("info", `Already logged in as: ${terminalPass.username}.`);
      emit("info", "Claim Terminal Pass — enter username:");
      setPrompt({ mode: "REG_USER" });
      return;
    }
    if (low === "login") {
      if (terminalPass) return emit("info", `Already logged in as: ${terminalPass.username}.`);
      emit("info", "Login — enter username:");
      setPrompt({ mode: "LOGIN_USER" });
      return;
    }

    // 2fa
    if (low === "2fa" || low === "security") return void start2FAEnroll();

    // wallet
    if (low === "wallet") return void walletStatus();
    if (low === "wallet list") return void walletList();
    if (low === "wallet disconnect" || low === "disconnect wallet" || low === "disconnect") return void walletDisconnect();
    if (low.startsWith("wallet connect") || low === "connect wallet" || low === "connect") return void walletConnectStart();
    if (low.startsWith("wallet switch")) {
      if (!requirePass()) return;
      const parts = v.split(/\s+/);
      const n = Number(parts[2]);
      if (Number.isFinite(n) && n > 0) return void walletSwitchByIndex(Math.floor(n));
      walletList();
      emit("info", "Reply with wallet number to switch:");
      setPrompt({ mode: "WALLET_SWITCH_PICK" });
      return;
    }
    if (low.startsWith("wallet forget")) {
      if (!requirePass()) return;
      const parts = v.split(/\s+/);
      const n = Number(parts[2]);
      if (Number.isFinite(n) && n > 0) return void walletForgetByIndex(Math.floor(n));
      walletList();
      emit("info", "Reply with wallet number to forget:");
      setPrompt({ mode: "WALLET_FORGET_PICK" });
      return;
    }

    // econ
    if (low === "allocate" || low === "allocate usddd" || low === "claim usddd" || low === "claim") return void doAllocate();
    if (low === "acquire" || low === "acquire usddd" || low === "buy" || low === "buy usddd") {
      if (!requirePass()) return;
      emit("info", "Enter amount to acquire (USDDD):");
      setPrompt({ mode: "ACQUIRE_USDDD_AMOUNT" });
      return;
    }

    // user dig
    if (low === "dig") return void startDig();
    if (low === "dig history") return void showDigHistory();
    if (low === "rewards") return void showRewards();

    // withdraw
    if (low === "withdraw") return void openWithdraw();
    if (low === "withdraw usddd") return void openWithdrawUSDDD();
    if (low === "withdraw treasure") return void openWithdrawTreasure();

    // sponsor
    if (low === "create box") return void startSponsorCreateBox();
    if (low === "my boxes" || low === "boxes") return void sponsorListMyBoxes();
    if (low === "use box") return void sponsorUseBoxPrompt();
    if (low === "box") {
      if (!requireSponsorConsole()) return;
      const c = currentSponsorBox();
      if (!c) return emit("warn", "No active box selected.");
      return void sponsorBoxSummary(c);
    }
    if (low === "bind token") return void sponsorBindTokenStart();
    if (low === "deposit" || low === "deposit box" || low === "fund box") return void sponsorDeposit();
    if (low === "configure") return void sponsorConfigureStart();
    if (low === "activate" || low === "resume box") return void sponsorActivate();
    if (low === "deactivate" || low === "pause box") return void sponsorDeactivate();

    if (low === "set cost") {
      if (!requireSponsorConsole() || !require2FAEnabled() || !requireWallet()) return;
      if (!currentSponsorBox()) return emit("warn", "No active box selected.");
      emit("info", `Enter USDDD cost per dig (${COST_MIN}–${COST_MAX}):`);
      emit("sys", "USDDD required per dig attempt.");
      setPrompt({ mode: "SP_SET_COST" });
      return;
    }
    if (low === "set cooldown") {
      if (!requireSponsorConsole() || !require2FAEnabled() || !requireWallet()) return;
      const box = currentSponsorBox();
      if (!box) return emit("warn", "No active box selected.");

      if (box.maxDigsPerUser === 1) {
        emit("warn", "Cooldown is not applicable for one-time boxes.");
        emit("sys", `Current: limit=one-time • cooldown=${cooldownLabel(box)}`);
        return;
      }

      emit("info", `Enter cooldown hours (${COOLDOWN_MIN_H}–${COOLDOWN_MAX_H}):`);
      emit("sys", "Minimum time between digs (same user).");
      setPrompt({ mode: "SP_SET_COOLDOWN" });
      return;
    }

    if (low === "set reward") {
      if (!requireSponsorConsole() || !require2FAEnabled() || !requireWallet()) return;
      if (!currentSponsorBox()) return emit("warn", "No active box selected.");
      emit("info", "Select reward mode:");
      emit("sys", "Tokens paid out per successful dig.");
      emit("info", `• ${C("1")}) Fixed`);
      emit("info", `• ${C("2")}) Random`);
      emit("info", `Reply with ${C("1")} or ${C("2")}:`);
      setPrompt({ mode: "SP_SET_REWARD_MODE" });
      return;
    }
    if (low === "set meta" || low === "set links" || low === "set info") {
      return void sponsorSetMetaStart();
    }

    if (low === "set limit") {
      if (!requireSponsorConsole() || !require2FAEnabled() || !requireWallet()) return;
      if (!currentSponsorBox()) return emit("warn", "No active box selected.");
      emit("info", `Enter max digs per user, or type ${C("NONE")} for unlimited.`);
      emit("sys", "Max digs per Terminal Pass for this box.");
      emit("sys", `Examples: ${C("1")} (one-time) • ${C("3")} (max 3 per user) • ${C("NONE")} (unlimited)`);
      setPrompt({ mode: "SP_SET_LIMIT" });
      return;
    }
    if (low === "set max") {
      emit("warn", "Deprecated command: use 'set limit'.");
      // route to set limit
      if (!requireSponsorConsole() || !require2FAEnabled() || !requireWallet()) return;
      if (!currentSponsorBox()) return emit("warn", "No active box selected.");
      emit("info", `Enter max digs per user, or type ${C("NONE")} for unlimited.`);
      emit("sys", "Max digs per Terminal Pass for this box.");
      setPrompt({ mode: "SP_SET_LIMIT" });
      return;
    }

    if (low === "box stats") return void sponsorBoxStats();
    if (low === "claim history") return void sponsorClaimHistory();

    // admin
    if (low === "stats") {
      const totalDigs = digHistoryRef.current.length;
      const usdddUsed = digHistoryRef.current.reduce((a, r) => a + r.spentUSDDD, 0);
      const treasureClaimed = Object.values(treasureBalancesRef.current).reduce((a, v2) => a + v2, 0);

      emit("info", "LOCAL STATS");
      emit("sys", "");
      emit("sys", `Dig attempts: ${totalDigs}`);
      emit("sys", `USDDD spent: ${usdddUsed.toFixed(2)}`);
      emit("sys", `USDDD treasury: ${treasuryRef.current.toFixed(2)}`);
      emit("sys", `Rewards claimed (tokens): ${treasureClaimed.toFixed(2)}`);
      emit("sys", "");
      emit("info", "NEXT");
      emit("sys", `Next: ${C("gstats")}`);
      return;
    }
    if (low === "reset") {
      if (consoleModeRef.current !== "ADMIN") return emit("err", "Reset requires ADMIN console.");
      emit("warn", "Reset options:");
      emit("info", "1 = Reset STATS (treasury + allocation clock)");
      emit("info", "2 = Reset ALL (stats + balances + history + campaigns + dig gates)");
      emit("info", "Reply 1 or 2:");
      setPrompt({ mode: "ADMIN_RESET_PICK" });
      return;
    }

    // dig selection helper commands
    if (low === "treasures") return void listTreasures();

    emit("err", `Unknown command: '${v}'.`);
    emit("info", "NEXT");
    emit("sys", `Next: ${C("commands")}`);
    emit("sys", `Or: ${C("help")}`);
  };

  // INPUT HANDLER
  const submitInput = (raw: string) => {
    const value = raw; // do not trim yet (we allow empty ENTER for withdraw addr)
    const trimmed = normalizeInput(raw);

    if (trimmed.toLowerCase() === "cancel") {
      emit("cmd", "> cancel");
      setPrompt({ mode: "IDLE" });
      emit("sys", "Prompt cancelled.");
      return;
    }

    // allow empty ENTER only for withdraw address prompts
    const allowEmpty =
      prompt.mode === "WITHDRAW_USDDD_ADDR" ||
      prompt.mode === "WITHDRAW_TREASURE_ADDR";

    if (!allowEmpty && trimmed.length === 0) return;

    if (prompt.mode === "IDLE") {
      if (trimmed.length === 0) return;
      return void runCommand(trimmed);
    }

    emit("cmd", `> ${trimmed.length === 0 ? "" : trimmed}`);

    if (prompt.mode === "DOCS_SELECT") {
      if (trimmed === "1") {
        window.open(DOCS.genesis, "_blank", "noopener,noreferrer");
        emit("ok", "Opened: Genesis (GitHub)");
        setPrompt({ mode: "IDLE" });
        return;
      }
      if (trimmed === "2") {
        window.open(DOCS.whitepaper, "_blank", "noopener,noreferrer");
        emit("ok", "Opened: Whitepaper (GitHub)");
        setPrompt({ mode: "IDLE" });
        return;
      }
      if (trimmed === "3") {
        window.open(DOCS.monetary, "_blank", "noopener,noreferrer");
        emit("ok", "Opened: Monetary Policy (GitHub)");
        setPrompt({ mode: "IDLE" });
        return;
      }
      if (trimmed === "4") {
        window.open(DOCS.glossary, "_blank", "noopener,noreferrer");
        emit("ok", "Opened: Glossary (GitHub)");
        setPrompt({ mode: "IDLE" });
        return;
      }
      emit("warn", `Reply with ${C("1")}–${C("4")}, or type ${C("cancel")}.`);
      return;
    }

    if (prompt.mode === "HELP_SELECT") {
      if (trimmed === "1") printHelpContext("USER");
      else if (trimmed === "2") printHelpContext("SPONSOR");
      else if (trimmed === "3") printHelpContext("ADMIN");
      else emit("warn", `Reply with ${C("1")}, ${C("2")} or ${C("3")}.`);
      setPrompt({ mode: "IDLE" });
      return;
    }

    if (prompt.mode === "CONFIRM_NUKE") {
      // hard gate: admin only, even inside confirm prompt
      if (!terminalPass || terminalPass.username !== "admin") {
        emit("err", "ACCESS DENIED // ADMIN CLEARANCE REQUIRED");
        setPrompt({ mode: "IDLE" });
        return;
      }

      if (isYes(trimmed)) {
        setPrompt({ mode: "IDLE" });
        nukeLocalState();
        return;
      }
      if (isNo(trimmed)) {
        emit("sys", "NUKE cancelled.");
        setPrompt({ mode: "IDLE" });
        return;
      }
      emit("warn", `Type ${C("YES")} or ${C("NO")}.`);
      return;
    }

    // auth prompts
    if (prompt.mode === "REG_USER") {
      const u = trimmed.replace(/\s+/g, "");
      if (u.length < 3) return void emit("warn", "Username too short.");

      // DB-backed registration (Phase Zero)
      emit("sys", "Creating Terminal Pass...");
      setPrompt({ mode: "IDLE" });

      void (async () => {
        try {
          const r = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ username: u }),
          });

          const data = (await r.json()) as any;

          if (!r.ok) {
            emit("err", data?.error ?? `Register failed (HTTP ${r.status})`);
            emit("info", "NEXT");
            emit("sys", `Next: ${C("register")}`);
            return;
          }

          const pass = String(data.terminal_pass ?? "");
          if (!pass) {
            emit("err", "Register failed: missing terminal_pass.");
            return;
          }

          // Store a local session (Phase Zero)
          const tp: TerminalPass = {
            username: u,
            passHash: passHashOf(pass), // local-only marker
            createdAt: Date.now(),
            twoFaEnabled: false,
          };

          setTerminalPass(tp);

          emit("ok", `Terminal Pass claimed: ${G(u)}`);
          emit("warn", `SAVE THIS PASS (you will need it to login): ${G(pass)}`);
          emit("sys", "");
          emit("info", "NEXT");
          emit("sys", `Next: ${C("user")}`);
          emit("sys", `Or: ${C("sponsor")}`);
        } catch (e: any) {
          emit("err", `Register failed: ${e?.message ?? "Unknown error"}`);
        }
      })();

      return;
    }

    if (prompt.mode === "REG_PASS") {
      const pw = trimmed;
      if (pw.length < 6) return void emit("warn", "Password too short (min 6).");
      const u = prompt.authUser!;
      const tp: TerminalPass = { username: u, passHash: passHashOf(pw), createdAt: Date.now(), twoFaEnabled: false };
      const users = loadUsers();
      users[u] = tp;
      saveUsers(users);
      setTerminalPass(tp);
      emit("ok", `Terminal Pass claimed: ${G(u)}`);
      emit("sys", "");
      emit("info", "NEXT");
      emit("sys", `Next: ${C("user")}`);
      emit("sys", `Or: ${C("sponsor")}`);
      setPrompt({ mode: "IDLE" });
      return;
    }

    if (prompt.mode === "LOGIN_USER") {
      const u = trimmed.replace(/\s+/g, "");
      if (u.length < 3) return void emit("warn", "Enter a valid username.");
      emit("info", "Enter Terminal Pass:");
      setPrompt({ mode: "LOGIN_PASS", authUser: u });
      return;
    }

    if (prompt.mode === "LOGIN_PASS") {
      const u = prompt.authUser!;
      const pass = trimmed;

      emit("sys", "Authenticating…");
      setPrompt({ mode: "IDLE" });

      void (async () => {
        try {
          const r = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              username: u,
              terminal_pass: pass,
            }),
          });

          const data = await r.json();

          if (!r.ok || !data.ok) {
            emit("err", data.error ?? "Login failed.");
            emit("info", "NEXT");
            emit("sys", `Next: ${C("login")}`);
            return;
          }

          // hydrate terminal pass from DB result
          const tp: TerminalPass = {
            username: data.user.username,
            passHash: passHashOf(pass), // local cache only
            createdAt: Date.now(),
            twoFaEnabled: data.user.twofa_enabled ?? false,
            twoFaSeed: data.user.twofa_seed ?? undefined,
          };

          // persist locally (Phase Zero hybrid)
          const users = loadUsers();
          users[tp.username] = tp;
          saveUsers(users);

          setTerminalPass(tp);

          emit("ok", `Login success: ${G(tp.username)}`);
          emit("sys", "");
          emit("info", "NEXT");
          emit("sys", `Next: ${C("user")}`);
          emit("sys", `Or: ${C("sponsor")}`);
        } catch (e) {
          emit("err", "Login error (network or server).");
          emit("info", "NEXT");
          emit("sys", `Next: ${C("login")}`);
        }
      })();

      return;
    }

    // wallet connect prompts
    if (prompt.mode === "WALLET_CONNECT_CHAIN_PICK") {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 1 || n > CHAINS.length) return void emit("warn", "Invalid selection.");
      const chainId = CHAINS[n - 1].id;
      walletConnectAskLabel(chainId);
      return;
    }

    if (prompt.mode === "WALLET_CONNECT_LABEL") {
      const chainId = prompt.walletTempChainId ?? "ETH";
      const label = trimmed || `${chainLabel(chainId)} Wallet`;
      walletConnectAskAddress(chainId, label);
      return;
    }

    if (prompt.mode === "WALLET_CONNECT_ADDR") {
      const chainId = prompt.walletTempChainId ?? "ETH";
      const label = prompt.address ?? "Wallet";

      const t = trimmed.toUpperCase();
      let addr = trimmed;

      if (t === "AUTO") {
        if (chainFamily(chainId) === "SOL") {
          addr = `So${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 10)}`; // mock
        } else {
          addr = `0x${Math.random().toString(16).slice(2).padEnd(40, "0").slice(0, 40)}`;
        }
      }

      if (!looksLikeAddress(addr)) return void emit("warn", "Address looks too short.");

      walletAddWithRegistry(chainId, label, addr);
      setPrompt({ mode: "IDLE" });
      return;
    }

    if (prompt.mode === "WALLET_SWITCH_PICK") {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n <= 0) return void emit("warn", "Enter a valid wallet number.");
      walletSwitchByIndex(Math.floor(n));
      setPrompt({ mode: "IDLE" });
      return;
    }

    if (prompt.mode === "WALLET_FORGET_PICK") {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n <= 0) return void emit("warn", "Enter a valid wallet number.");
      walletForgetByIndex(Math.floor(n));
      setPrompt({ mode: "IDLE" });
      return;
    }

    // 2fa prompt
    if (prompt.mode === "NEED_2FA") {
      if (!/^\d{6}$/.test(trimmed)) return void emit("warn", "Invalid 2FA code (6 digits).");

      if (prompt.twoFaPurpose === "ENROLL") {
        setTerminalPass((tp) => (tp ? { ...tp, twoFaEnabled: true, twoFaSeed: prompt.twoFaSeed } : tp));
        emit("ok", "2FA enabled.");
        setPrompt({ mode: "IDLE" });
        return;
      }

      if (prompt.withdrawKind === "USDDD") {
        const amt = prompt.amount ?? 0;
        setUsdddAcquired((p) => Math.max(0, p - amt));
        emit("ok", "USDDD withdrawal submitted (mock).");
        emit("sys", `to=${shortAddr(prompt.address ?? "")}`);
        emit("sys", `tx=0x${Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64)}`);
        setPrompt({ mode: "IDLE" });
        return;
      }

      if (prompt.withdrawKind === "TREASURE") {
        if (!authedUser) {
          emit("err", "No active user.");
          setPrompt({ mode: "IDLE" });
          return;
        }
        const key = prompt.selectedAsset ?? "";
        const amt = prompt.amount ?? 0;

        const res = withdrawTreasureFIFO(authedUser, key, amt);
        if (!res.ok) {
          emit("err", res.err);
          setPrompt({ mode: "IDLE" });
          return;
        }

        const { chainId, symbol, tokenAddress } = parseTreasureGroupKey(key);
        emit("ok", "Treasure withdrawal submitted (mock).");
        emit("sys", `asset=${symbol} • chain=${chainLabel(chainId)} • token=${shortAddr(tokenAddress)}`);
        emit("sys", `amount=${amt.toFixed(6)} • to=${shortAddr(prompt.address ?? "")}`);
        emit("sys", `tx=${res.tx}`);
        setPrompt({ mode: "IDLE" });
        return;
      }

      setPrompt({ mode: "IDLE" });
      return;
    }

    // econ
    if (prompt.mode === "ACQUIRE_USDDD_AMOUNT") {
      if (!requirePass()) return;

      const amt = Number(trimmed);
      if (!Number.isFinite(amt) || amt <= 0) return void emit("warn", "Enter a valid amount.");

      const user = terminalPass!.username;
      const currentTotal = getAcquiredTotalForUser(user);
      const nextTotal = currentTotal + amt;

      if (nextTotal > ACQUIRE_CAP + 1e-9) {
        const remaining = Math.max(0, ACQUIRE_CAP - currentTotal);
        emit("err", `ACQUIRE BLOCKED // USDDD ACQUISITION CAP REACHED (${ACQUIRE_CAP})`);
        emit("info", `Remaining cap: ${remaining.toFixed(2)} USDDD`);
        emit("sys", "Cap applies to acquired USDDD only (not daily allocation).");
        setPrompt({ mode: "IDLE" });
        return;
      }

      const updatedTotal = addAcquiredForUser(user, amt);
      setAcquiredTotal(updatedTotal);
      setUsdddAcquired((p) => p + amt);

      emit("ok", `Acquired confirmed: +${amt.toFixed(2)} USDDD (Acquired).`);
      emit("sys", `Acquired total (this device): ${updatedTotal.toFixed(2)} / ${ACQUIRE_CAP}`);
      setPrompt({ mode: "IDLE" });
      return;
    }

    // dig prompts
    if (prompt.mode === "DIG_CHOICE") {
      if (trimmed === "1") {
        const active = campaignsRef.current.filter((c) => c.status === "ACTIVE" && c.stage === "CONFIGURED" && availableBalance(c) > 0);
        if (active.length === 0) {
          emit("warn", "No active treasures available.");
          setPrompt({ mode: "IDLE" });
          return;
        }
        const c = active[Math.floor(Math.random() * active.length)];
        digConfirmForCampaign(c);
        return;
      }
      if (trimmed === "2") return void listTreasures();
      return void emit("warn", `Reply with ${C("1")} or ${C("2")}.`);
    }

    if (prompt.mode === "DIG_SELECT") {
      const active = campaignsRef.current.filter((c) => c.status === "ACTIVE" && c.stage === "CONFIGURED" && availableBalance(c) > 0);
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 1 || n > active.length) return void emit("warn", "Invalid selection.");
      digConfirmForCampaign(active[n - 1]);
      return;
    }

    if (prompt.mode === "DIG_CONFIRM") {
      if (isNo(trimmed)) {
        emit("sys", "Dig cancelled.");
        setPrompt({ mode: "IDLE" });
        return;
      }
      if (!isYes(trimmed)) return void emit("warn", `Reply ${C("Y")} or ${C("N")}.`);
      const c = campaignsRef.current.find((x) => x.id === prompt.selectedCampaignId);
      if (!c) {
        emit("err", "Box not found.");
        setPrompt({ mode: "IDLE" });
        return;
      }
      setPrompt({ mode: "IDLE" });
      void executeDig(c);
      return;
    }

    // withdraw prompts
    if (prompt.mode === "WITHDRAW_PICK") {
      if (trimmed === "1") return void openWithdrawUSDDD();
      if (trimmed === "2") return void openWithdrawTreasure();
      return void emit("warn", `Reply with ${C("1")} or ${C("2")}.`);
    }

    if (prompt.mode === "WITHDRAW_USDDD_AMOUNT") {
      const amt = Number(trimmed);
      if (!Number.isFinite(amt) || amt <= 0) return void emit("warn", "Enter a valid amount.");
      if (amt > usdddAcquiredRef.current) return void emit("err", "Amount exceeds acquired balance.");
      emit("info", "Enter destination address (press ENTER to use connected wallet):");
      setPrompt({ mode: "WITHDRAW_USDDD_ADDR", withdrawKind: "USDDD", amount: amt });
      return;
    }

    if (prompt.mode === "WITHDRAW_USDDD_ADDR") {
      const dest = trimmed.length > 0 ? trimmed : activeWallet?.address ?? "";
      if (!looksLikeAddress(dest)) return void emit("warn", "Address looks too short.");
      withdrawGasNotice(activeWallet?.chainId ?? "ETH");
      emit("sys", `Destination: ${shortAddr(dest)} (connected wallet default)`);
      emit("warn", "Enter 6-digit 2FA code:");
      setPrompt({ mode: "NEED_2FA", twoFaPurpose: "STEPUP", withdrawKind: "USDDD", amount: prompt.amount, address: dest });
      return;
    }

    if (prompt.mode === "WITHDRAW_TREASURE_PICK") {
      const groups = listTreasureGroupsForUser(authedUser);
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 1 || n > groups.length) return void emit("warn", "Invalid selection.");
      const g = groups[n - 1];
      emit("info", `Selected: ${g.symbol} • ${chainLabel(g.chainId)} • ${g.amount.toFixed(6)}`);
      emit("sys", `token=${shortAddr(g.tokenAddress)} • claims=${g.claimsCount} • boxes=${g.boxesCount}`);
      emit("info", "Enter amount to withdraw:");
      setPrompt({ mode: "WITHDRAW_TREASURE_AMOUNT", withdrawKind: "TREASURE", selectedAsset: g.key });
      return;
    }

    if (prompt.mode === "WITHDRAW_TREASURE_AMOUNT") {
      const amt = Number(trimmed);
      const key = prompt.selectedAsset ?? "";
      if (!Number.isFinite(amt) || amt <= 0) return void emit("warn", "Enter a valid amount.");

      const max = getTreasureGroupAmount(authedUser, key);
      const EPS = 1e-6; // 0.000001 tokens tolerance
      if (amt - max > EPS) return void emit("err", "Amount exceeds available.");

      emit("info", "Enter destination address (press ENTER to use connected wallet):");
      setPrompt({ mode: "WITHDRAW_TREASURE_ADDR", withdrawKind: "TREASURE", selectedAsset: key, amount: amt });
      return;
    }

    if (prompt.mode === "WITHDRAW_TREASURE_ADDR") {
      const key = prompt.selectedAsset ?? "";
      const { chainId } = parseTreasureGroupKey(key);

      const dest = trimmed.length > 0 ? trimmed : activeWallet?.address ?? "";
      if (!looksLikeAddress(dest)) return void emit("warn", "Address looks too short.");

      withdrawGasNotice(chainId);
      emit("sys", `Destination: ${shortAddr(dest)} (connected wallet default)`);
      emit("warn", "Enter 6-digit 2FA code:");

      setPrompt({
        mode: "NEED_2FA",
        twoFaPurpose: "STEPUP",
        withdrawKind: "TREASURE",
        selectedAsset: key,
        amount: prompt.amount,
        address: dest,
      });
      return;
    }

    // admin reset
    if (prompt.mode === "ADMIN_RESET_PICK") {
      if (trimmed === "1") return void (adminResetStats(), setPrompt({ mode: "IDLE" }));
      if (trimmed === "2") return void (adminResetAll(), setPrompt({ mode: "IDLE" }));
      return void emit("warn", `Reply ${C("1")} or ${C("2")}.`);
    }

    if (prompt.mode === "SP_CREATE_CHAIN_PICK") {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 1 || n > CHAINS.length) return void emit("warn", "Invalid selection.");
      const chainId = CHAINS[n - 1].id;

      emit("warn", `Deployment chain selected: ${chainLabel(chainId)}.`);
      emit(
        "warn",
        `I, "${authedUser}", understand that as a sponsor I will pay deployment and gas fees to deploy a Treasure Box contract and deposit tokens that will be distributed to DIGDUG.DO users under protocol-defined rules.`
      );
      emit("warn", "This action is non-reversible once deployment begins.");
      emit("warn", `Proceed with deployment on ${chainLabel(chainId)}? (${C("Y")}/${C("N")})`);

      setPrompt({ mode: "SP_CREATE_DECLARATION_CONFIRM", walletTempChainId: chainId });
      return;
    }

    if (prompt.mode === "SP_CREATE_DECLARATION_CONFIRM") {
      if (isNo(trimmed)) {
        emit("sys", "Sponsor flow aborted.");
        setPrompt({ mode: "IDLE" });
        return;
      }
      if (!isYes(trimmed)) return void emit("warn", `Reply ${C("Y")} or ${C("N")}.`);

      const chainId = prompt.walletTempChainId ?? "ETH";
      sponsorDeployBox(chainId);
      setPrompt({ mode: "IDLE" });
      return;
    }

    // sponsor prompts
    if (prompt.mode === "SP_CONFIG_PICK") {
      const box = currentSponsorBox();
      if (!box) {
        emit("warn", "No active box selected.");
        setPrompt({ mode: "IDLE" });
        return;
      }

      // route to the real commands in correct order
      if (trimmed === "1") { setPrompt({ mode: "IDLE" }); runCommand("set cost"); return; }
      if (trimmed === "2") { setPrompt({ mode: "IDLE" }); runCommand("set reward"); return; }
      if (trimmed === "3") { setPrompt({ mode: "IDLE" }); runCommand("set limit"); return; }

      if (trimmed === "4") {
        if (box.maxDigsPerUser === 1) {
          emit("warn", "Cooldown is not applicable for one-time boxes.");
          // keep them in the config menu
          setPrompt({ mode: "SP_CONFIG_PICK" });
          return;
        }
        setPrompt({ mode: "IDLE" });
        runCommand("set cooldown");
        return;
      }

      if (trimmed === "5") { setPrompt({ mode: "IDLE" }); runCommand("activate"); return; }

      emit("warn", `Reply with ${C("1")}–${C("5")}.`);
      return;
    }

    if (prompt.mode === "SP_HARDGATE_CONFIRM") {
      if (isNo(trimmed)) {
        emit("sys", "Sponsor flow aborted.");
        setPrompt({ mode: "IDLE" });
        return;
      }
      if (!isYes(trimmed)) return void emit("warn", `Reply ${C("Y")} or ${C("N")}.`);
      if (!requireWallet()) {
        setPrompt({ mode: "IDLE" });
        return;
      }
      emit("info", "Select chain for Treasure Box deployment:");
      CHAINS.forEach((c, idx) => emit("info", `• ${C(String(idx + 1))}) ${c.label} (${c.standard})`));
      emit("info", `Reply with ${C("1")}–${C(String(CHAINS.length))}:`);
      setPrompt({ mode: "SP_CHAIN_PICK" });
      return;
    }

    if (prompt.mode === "SP_CHAIN_PICK") {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 1 || n > CHAINS.length) return void emit("warn", "Invalid selection.");
      const chainId = CHAINS[n - 1].id;
      sponsorDeployBox(chainId);
      setPrompt({ mode: "IDLE" });
      return;
    }

    if (prompt.mode === "SP_TOKEN_ADDRESS") {
      const addr = trimmed;
      if (!looksLikeAddress(addr)) return void emit("warn", "Invalid contract address.");
      sponsorBindTokenApply(addr);
      setPrompt({ mode: "IDLE" });
      return;
    }

    if (prompt.mode === "SP_SET_COST") {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n <= 0) return void emit("warn", "Enter a valid numeric cost.");
      const cost = clamp(n, COST_MIN, COST_MAX);
      const box = currentSponsorBox();
      if (!box) return void setPrompt({ mode: "IDLE" });
      setCampaigns((prev) => prev.map((c) => (c.id === box.id ? { ...c, costUSDDD: cost } : c)));
      emit("ok", `Cost updated: ${cost.toFixed(2)} USDDD`);
      setPrompt({ mode: "IDLE" });
      return;
    }

    if (prompt.mode === "SP_SET_COOLDOWN") {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n <= 0) return void emit("warn", "Enter a valid numeric cooldown.");
      const cd = clamp(Math.floor(n), COOLDOWN_MIN_H, COOLDOWN_MAX_H);
      const box = currentSponsorBox();
      if (!box) return void setPrompt({ mode: "IDLE" });
      setCampaigns((prev) => prev.map((c) => (c.id === box.id ? { ...c, cooldownHours: cd } : c)));
      emit("ok", `Cooldown updated: ${cd}h`);
      setPrompt({ mode: "IDLE" });
      return;
    }

    if (prompt.mode === "SP_SET_REWARD_MODE") {
      if (trimmed === "1") {
        emit("info", "Enter fixed reward amount per claim:");
        setPrompt({ mode: "SP_SET_REWARD_FIXED" });
        return;
      }
      if (trimmed === "2") {
        emit("info", "Enter random MIN reward amount:");
        setPrompt({ mode: "SP_SET_REWARD_RANDOM_MIN" });
        return;
      }
      return void emit("warn", `Reply with ${C("1")} or ${C("2")}.`);
    }

    if (prompt.mode === "SP_SET_REWARD_FIXED") {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n <= 0) return void emit("warn", "Enter a valid amount.");
      const box = currentSponsorBox();
      if (!box) return void setPrompt({ mode: "IDLE" });
      setCampaigns((prev) => prev.map((c) => (c.id === box.id ? { ...c, rewardMode: "FIXED", fixedReward: Math.max(MIN_YIELD_FLOOR, n) } : c)));
      emit("ok", `Reward updated: FIXED ${n}`);
      setPrompt({ mode: "IDLE" });
      return;
    }

    if (prompt.mode === "SP_SET_REWARD_RANDOM_MIN") {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n <= 0) return void emit("warn", "Enter a valid min.");
      emit("info", "Enter random MAX reward amount:");
      setPrompt({ mode: "SP_SET_REWARD_RANDOM_MAX", spTempRandMin: n });
      return;
    }

    if (prompt.mode === "SP_SET_REWARD_RANDOM_MAX") {
      const n = Number(trimmed);
      const min = prompt.spTempRandMin ?? MIN_YIELD_FLOOR;
      if (!Number.isFinite(n) || n <= 0) return void emit("warn", "Enter a valid max.");
      const lo = Math.max(MIN_YIELD_FLOOR, Math.min(min, n));
      const hi = Math.max(lo, Math.max(min, n));
      const box = currentSponsorBox();
      if (!box) return void setPrompt({ mode: "IDLE" });
      setCampaigns((prev) => prev.map((c) => (c.id === box.id ? { ...c, rewardMode: "RANDOM", randomMin: lo, randomMax: hi } : c)));
      emit("ok", `Reward updated: RANDOM [${lo}, ${hi}]`);
      setPrompt({ mode: "IDLE" });
      return;
    }

    if (prompt.mode === "SP_SET_LIMIT") {
      const box = currentSponsorBox();
      if (!box) return void setPrompt({ mode: "IDLE" });

      if (trimmed.toLowerCase() === "none") {
        setCampaigns((prev) => prev.map((c) => (c.id === box.id ? { ...c, maxDigsPerUser: null } : c)));
        emit("ok", "Dig limit cleared: unlimited per user.");
        setPrompt({ mode: "IDLE" });
        return;
      }

      const n = Number(trimmed);
      if (!Number.isFinite(n) || n <= 0) return void emit("warn", "Enter a valid number or NONE.");
      const lim = Math.floor(n);

      setCampaigns((prev) => prev.map((c) => (c.id === box.id ? { ...c, maxDigsPerUser: lim } : c)));
      emit("ok", `Dig limit set: max ${lim} per user`);
      setPrompt({ mode: "IDLE" });
      return;
    }


    if (prompt.mode === "SP_META_PICK") {
      const box = currentSponsorBox();
      if (!box) {
        emit("warn", "No active box selected.");
        setPrompt({ mode: "IDLE" });
        return;
      }

      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 1 || n > 7) {
        emit("warn", `Reply with ${C("1")}–${C("7")}.`);
        return;
      }

      if (n === 7) {
        emit("ok", "Sponsor metadata saved.");
        setPrompt({ mode: "IDLE" });
        return;
      }

      const map: Array<{ key: keyof SponsorMeta; label: string }> = [
        { key: "website", label: "Website" },
        { key: "x", label: "X" },
        { key: "discord", label: "Discord" },
        { key: "telegram", label: "Telegram" },
        { key: "cmc", label: "CoinMarketCap" },
        { key: "cg", label: "CoinGecko" },
      ];

      const sel = map[n - 1];
      const existing = (box.meta as any)?.[sel.key] as string | undefined;
      if (existing && existing.trim().length > 0) {
        emit("warn", `${sel.label} already set and immutable.`);
        sponsorMetaMenu(box);
        return;
      }

      emit("info", `Enter ${sel.label} (or type ${C("NONE")} to skip):`);
      setPrompt({ mode: "SP_META_VALUE", spMetaKey: sel.key });
      return;
    }

    if (prompt.mode === "SP_META_VALUE") {
      const box = currentSponsorBox();
      if (!box) {
        emit("warn", "No active box selected.");
        setPrompt({ mode: "IDLE" });
        return;
      }
      const key = prompt.spMetaKey;
      if (!key) {
        setPrompt({ mode: "IDLE" });
        return;
      }

      if (trimmed.toLowerCase() === "none") {
        emit("sys", "Skipped.");
        sponsorMetaMenu(box);
        return;
      }

      const existing = (box.meta as any)?.[key] as string | undefined;
      if (existing && existing.trim().length > 0) {
        emit("warn", "Field already set and immutable.");
        sponsorMetaMenu(box);
        return;
      }

      const nextMeta = { ...(box.meta ?? {}), [key]: trimmed };
      setCampaigns((prev) => prev.map((c) => (c.id === box.id ? { ...c, meta: nextMeta } : c)));

      emit("ok", "Metadata updated.");
      sponsorMetaMenu({ ...box, meta: nextMeta });
      return;
    }

    if (prompt.mode === "SP_BOX_PICK_FOR_USE") {
      const ids = prompt.spPickList ?? [];
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 1 || n > ids.length) return void emit("warn", "Invalid selection.");
      const chosenId = ids[n - 1];
      setSponsorActiveBoxId(chosenId);
      const chosen = campaignsRef.current.find((c) => c.id === chosenId) ?? null;
      emit("ok", `Active box set: ${chosenId}`);
      if (chosen) sponsorBoxSummary(chosen);
      setPrompt({ mode: "IDLE" });
      return;
    }

    emit("warn", `Input not expected here. Type ${C("cancel")} to abort.`);
    setPrompt({ mode: "IDLE" });
  };

  // form submit
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = cmd;
    setCmd("");
    submitInput(v);
  };

  // menu items
  const menuItems = useMemo(() => {
    const sponsorHasBoxes = !!authedUser && campaigns.some((c) => c.ownerUsername === authedUser);

    const base: Record<ConsoleMode, Array<{ label: string; cmd: string }>> = {
      USER: [
        { label: "Dig", cmd: "dig" },
        { label: "Allocate USDDD", cmd: "allocate usddd" },
        { label: "Acquire USDDD", cmd: "acquire usddd" },
        { label: "Wallet", cmd: "wallet" },
        { label: "Rewards", cmd: "rewards" },
        { label: "Withdraw", cmd: "withdraw" },
        { label: "Security (2FA)", cmd: "2fa" },
        { label: "Help", cmd: "help" },
        { label: "Commands", cmd: "commands" },
      ],
      SPONSOR: sponsorHasBoxes
        ? [
          { label: "Create Box", cmd: "create box" },
          { label: "My Boxes", cmd: "my boxes" },
          { label: "Use Box", cmd: "use box" },
          { label: "Box Summary", cmd: "box" },
          { label: "Bind Token", cmd: "bind token" },
          { label: "Deposit", cmd: "deposit" },
          { label: "Configure", cmd: "configure" },
          { label: "Activate", cmd: "activate" },
          { label: "Deactivate", cmd: "deactivate" },
          { label: "Set Limit", cmd: "set limit" },
          { label: "Set Meta", cmd: "set meta" },
          { label: "Box Stats", cmd: "box stats" },
          { label: "Claim History", cmd: "claim history" },
          { label: "Wallet", cmd: "wallet" },
          { label: "Help", cmd: "help" },
          { label: "Commands", cmd: "commands" },
        ]
        : [
          { label: "Create Box", cmd: "create box" },
          { label: "Wallet Connect", cmd: "wallet connect" },
          { label: "Security (2FA)", cmd: "2fa" },
          { label: "Help", cmd: "help" },
          { label: "Commands", cmd: "commands" },
        ],
      ADMIN: [
        { label: "Public Stats", cmd: "stats" },
        { label: "Reset", cmd: "reset" },
        { label: "Price Mock Mode", cmd: "price mock" },
        { label: "Help", cmd: "help" },
        { label: "Commands", cmd: "commands" },
      ],
    };

    const toolbox: Array<{ label: string; cmd: string }> = [
      { label: authedUser ? `Pass: ${authedUser}` : "Register / Login", cmd: authedUser ? "whoami" : "register" },
      { label: "WhoAmI", cmd: "whoami" },
      { label: "Register", cmd: "register" },
      { label: "Login", cmd: "login" },
      { label: "Logout", cmd: "logout" },
      { label: "Wallet", cmd: "wallet" },
      { label: "Wallet List", cmd: "wallet list" },
      { label: "Wallet Connect", cmd: "wallet connect" },
      { label: "Wallet Switch", cmd: "wallet switch" },
      { label: "Wallet Forget", cmd: "wallet forget" },
      { label: "Wallet Disconnect", cmd: "wallet disconnect" },
      { label: "Security (2FA)", cmd: "2fa" },
      { label: "Docs (GitHub)", cmd: "docs" },
      { label: "Build Info", cmd: "build" },
      { label: "Clear Screen", cmd: "clear" },
      { label: "NUKE (dev)", cmd: "nuke" },
      { label: "Close Panel", cmd: "menu" },
    ];

    return { base, toolbox };
  }, [authedUser, campaigns]);

  return (
    <main className={`dd-screen ${panelOpen ? "dd-dimall" : ""}`}>
      <div className="dd-topfade" aria-hidden="true" />
      <div className="dd-version-fixed">DIGDUG.DO {BUILD_VERSION}</div>

      {panelOpen && <div className="dd-backdrop" onClick={() => setPanelOpen(false)} aria-hidden="true" />}

      <section className="dd-terminal" aria-label="Terminal log" ref={termRef} onClick={() => panelOpen && setPanelOpen(false)}>
        <div className="dd-terminal-inner">
          {lines.map((l) => (
            <div key={l.id} className={`dd-line dd-${l.kind}`}>
              <span className="dd-ts">[{l.t}]</span>
              <span className="dd-text">{renderSegments(l.text)}</span>
            </div>
          ))}
          <div className="dd-cursor" aria-hidden="true">
            |
          </div>
        </div>
      </section>

      <section className={`dd-drawer ${panelOpen ? "is-open" : ""}`} aria-hidden={!panelOpen} onClick={(e) => e.stopPropagation()}>
        <div className="dd-drawer-top">
          <div className="dd-drawer-left">
            <div className="dd-drawer-title">
              <button type="button" className={`dd-gear ${toolboxOpen ? "is-on" : ""}`} onClick={() => setToolboxOpen((v2) => !v2)} aria-label="Toolbox" title="Toolbox">
                ⚙
              </button>
              <span>CONTROLS</span>
            </div>

            <div className="dd-consoles">
              {(["USER", "SPONSOR", "ADMIN"] as ConsoleMode[]).map((m) => (
                <button key={m} type="button" className={`dd-chip ${consoleMode === m ? "is-active" : ""}`} onClick={() => switchConsole(m)}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="dd-drawer-right">
            <div className="dd-balance">
              <span className="dd-balance-text">USDDD: {usdddTotal.toFixed(2)}</span>
              <span className="dd-usdddicon" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="dd-drawer-body">
          <div className="dd-menu">
            {(toolboxOpen ? menuItems.toolbox : menuItems.base[consoleMode]).map((it) => (
              <button key={it.label} type="button" className="dd-menu-item" onClick={() => submitInput(it.cmd)}>
                {it.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <form className="dd-command" onSubmit={onSubmit}>
        <div className="dd-command-left">
          <button className="dd-status" type="button" onClick={() => setPanelOpen((o) => !o)} aria-label="Open control panel" aria-expanded={panelOpen}>
            <span className="dd-usdddicon" aria-hidden="true" />
            <span className="dd-statuslabel">CONTROLS</span>
            <span className="dd-dots" aria-hidden="true">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </button>

          <span className="dd-prompt">{consoleMode}</span>
          {prompt.mode !== "IDLE" && <span className="dd-promptstate">• {prompt.mode}</span>}
          {!autoScroll && <span className="dd-scrolllock">SCROLL LOCK</span>}
        </div>

        <input
          className="dd-command-input"
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          placeholder={prompt.mode === "IDLE" ? "Type a command… (dig, create box, bind token, deposit, configure)" : "Reply here… (type cancel to abort)"}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          enterKeyHint="send"
          inputMode="text"
          spellCheck={false}
        />

        <button className="dd-command-send" type="submit">
          ENTER
        </button>
      </form>
    </main>
  );
}
