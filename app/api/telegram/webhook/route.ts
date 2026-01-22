import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { askBrain } from "@/lib/brain/answer";

function runInBackground(fn: () => Promise<void>) {
  fn().catch((e) => console.error("[tg] background error:", e));
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

type InlineKeyboard = { inline_keyboard: Array<Array<{ text: string; url?: string; callback_data?: string }>> };

async function tgCall(method: string, payload: any) {
  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({} as any));
  if (!res.ok || json?.ok === false) {
    const err: any = new Error(`tg_${method}_failed`);
    err.status = res.status;
    err.tg = json;
    err.payload = payload;
    throw err;
  }
  return json;
}

async function sendMessage(chatId: number, text: string, opts?: { replyMarkup?: InlineKeyboard }) {
  await tgCall("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(opts?.replyMarkup ? { reply_markup: opts.replyMarkup } : {}),
  });
}

// Used when we need to know if DM fails (user never started bot)
async function sendMessageChecked(chatId: number, text: string, opts?: { replyMarkup?: InlineKeyboard }) {
  return await tgCall("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(opts?.replyMarkup ? { reply_markup: opts.replyMarkup } : {}),
  });
}

async function deleteMessage(chatId: number, messageId: number) {
  try {
    await tgCall("deleteMessage", { chat_id: chatId, message_id: messageId });
  } catch (e) {
    // ignore (missing perms etc.)
    console.error("[tg] deleteMessage failed:", (e as any)?.tg ?? e);
  }
}

function restrictedPerms() {
  // Most restrictive: cannot send anything
  return {
    can_send_messages: false,
    can_send_audios: false,
    can_send_documents: false,
    can_send_photos: false,
    can_send_videos: false,
    can_send_video_notes: false,
    can_send_voice_notes: false,
    can_send_polls: false,
    can_send_other_messages: false,
    can_add_web_page_previews: false,
    can_change_info: false,
    can_invite_users: false,
    can_pin_messages: false,
    can_manage_topics: false,
  };
}

function normalPerms() {
  // Reasonable defaults for normal members
  return {
    can_send_messages: true,
    can_send_audios: true,
    can_send_documents: true,
    can_send_photos: true,
    can_send_videos: true,
    can_send_video_notes: true,
    can_send_voice_notes: true,
    can_send_polls: true,
    can_send_other_messages: true,
    can_add_web_page_previews: true,
    can_change_info: false,
    can_invite_users: true,
    can_pin_messages: false,
    can_manage_topics: false,
  };
}

async function restrictMember(chatId: number, userId: number) {
  try {
    await tgCall("restrictChatMember", {
      chat_id: chatId,
      user_id: userId,
      permissions: restrictedPerms(),
    });
  } catch (e) {
    console.error("[tg] restrictChatMember failed:", (e as any)?.tg ?? e);
  }
}

async function unrestrictMember(chatId: number, userId: number) {
  try {
    await tgCall("restrictChatMember", {
      chat_id: chatId,
      user_id: userId,
      permissions: normalPerms(),
    });
  } catch (e) {
    console.error("[tg] unrestrictChatMember failed:", (e as any)?.tg ?? e);
  }
}

async function banMember(chatId: number, userId: number, reason?: string) {
  try {
    await tgCall("banChatMember", {
      chat_id: chatId,
      user_id: userId,
      revoke_messages: true,
    });
  } catch (e) {
    console.error("[tg] banChatMember failed:", reason, (e as any)?.tg ?? e);
  }
}

async function kickMember(chatId: number, userId: number, reason?: string) {
  // Kick = ban then unban
  try {
    await tgCall("banChatMember", { chat_id: chatId, user_id: userId, revoke_messages: true });
    await tgCall("unbanChatMember", { chat_id: chatId, user_id: userId, only_if_banned: true });
  } catch (e) {
    console.error("[tg] kickMember failed:", reason, (e as any)?.tg ?? e);
  }
}

function reqEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function envOptional(name: string) {
  return process.env[name] || "";
}

// Service-role Supabase client (server-only)
const supabaseAdmin = createClient(reqEnv("SUPABASE_URL"), reqEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

type TgChat = {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

function chatDisplayTitle(chat: TgChat): string | null {
  if (chat.title) return chat.title;
  const name = [chat.first_name, chat.last_name].filter(Boolean).join(" ").trim();
  return name || null;
}

async function upsertTgChat(chat: TgChat) {
  const chat_id = String(chat.id);

  const payload = {
    chat_id,
    chat_type: chat.type ?? null,
    title: chatDisplayTitle(chat),
    username: chat.username ?? null,
    last_seen_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from("dd_tg_chats").upsert(payload, { onConflict: "chat_id" });
  if (error) console.error("[tg] dd_tg_chats upsert error:", error);
}

function getMsg(update: any) {
  return update?.message ?? update?.edited_message ?? null;
}

function getText(update: any): string {
  const msg = getMsg(update);
  const t = msg?.text ?? msg?.caption ?? "";
  return String(t).trim();
}

function getChat(update: any) {
  const msg = getMsg(update);
  return msg?.chat ?? null;
}

function getChatId(update: any): number | null {
  const chat = getChat(update);
  return typeof chat?.id === "number" ? chat.id : null;
}

function fromUser(update: any) {
  return update?.message?.from ?? update?.edited_message?.from ?? null;
}

function displayName(update: any): string {
  const u = fromUser(update);
  if (!u) return "user";
  if (u.username) return `@${u.username}`;
  const first = u.first_name ? String(u.first_name) : "";
  const last = u.last_name ? ` ${u.last_name}` : "";
  const full = `${first}${last}`.trim();
  return full || "user";
}

function mentionUserHtml(tgUserId: number, fallbackLabel = "user") {
  return `<a href="tg://user?id=${tgUserId}">${escapeHtml(fallbackLabel)}</a>`;
}

function generateVerifyCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "DG-";
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function looksLikeEvmAddress(a: string) {
  return /^0x[a-fA-F0-9]{8,}$/.test(a.trim());
}

function maskEvmAddress(addr: string) {
  const a = addr.trim();
  if (!a.startsWith("0x") || a.length < 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function looksLikeTxHash(h: string) {
  const s = h.trim();
  if (/^0x[a-fA-F0-9]{16,}$/.test(s)) return true;
  if (s.includes("bscscan.com/tx/")) return true;
  return false;
}

function extractTxHashOrLink(input: string): { txHash: string | null; txUrl: string | null } {
  const s = input.trim();
  const m = s.match(/bscscan\.com\/tx\/(0x[a-fA-F0-9]{16,})/);
  if (m?.[1]) {
    const tx = m[1];
    return { txHash: tx, txUrl: `https://bscscan.com/tx/${tx}` };
  }
  if (/^0x[a-fA-F0-9]{16,}$/.test(s)) return { txHash: s, txUrl: `https://bscscan.com/tx/${s}` };
  return { txHash: null, txUrl: null };
}

function tgDeepLinkVerify() {
  return "https://t.me/DigsterBot?start=verify";
}

function verifyButton(): InlineKeyboard {
  return { inline_keyboard: [[{ text: "✅ Verify now", url: tgDeepLinkVerify() }]] };
}

function welcomeText(firstName?: string, graceMinutes = 10) {
  const first = firstName ? ` ${firstName}` : "";
  return `Welcome${first}.

<b>DIGDUG.DO</b> is a terminal-style crypto treasure hunt.
You dig using <b>USDDD</b> protocol fuel and can win sponsor tokens.

<b>Verification required</b> (Phase Zero testers)

You are restricted until verified.
You have <b>${graceMinutes} minutes</b> to verify or you will be removed.

<b>Step 1:</b> DM @DigsterBot and type <code>/verify</code>
<b>Step 2:</b> Go to https://digdug.do and in Terminal type:
<code>verify DG-XXXX</code>`;
}

function reminderText(minutesLeft: number) {
  return `⚠️ <b>Verification required</b>

You have <b>${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}</b> left to verify or you will be removed.

DM @DigsterBot and type <code>/verify</code>`;
}

async function maybeSendGraceExpiryReminders() {
  const now = new Date();
  const soon = new Date(now.getTime() + 2 * 60 * 1000);

  const nowIso = now.toISOString();
  const soonIso = soon.toISOString();

  const { data: rows, error } = await supabaseAdmin
    .from("dd_tg_pending_joins")
    .select("group_chat_id,tg_user_id,grace_expires_at,reminded_at,status")
    .eq("status", "PENDING")
    .is("reminded_at", null)
    .gt("grace_expires_at", nowIso)
    .lte("grace_expires_at", soonIso)
    .limit(25);

  if (error) {
    console.error("[tg] reminder query failed:", error);
    return;
  }
  if (!rows || rows.length === 0) return;

  for (const r of rows as any[]) {
    const groupChatId = Number(r.group_chat_id);
    const expiresAt = new Date(r.grace_expires_at);
    const minsLeft = Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / (60 * 1000)));

    await sendMessage(groupChatId, reminderText(minsLeft), { replyMarkup: verifyButton() });

    const { error: uErr } = await supabaseAdmin
      .from("dd_tg_pending_joins")
      .update({ reminded_at: new Date().toISOString() })
      .eq("group_chat_id", String(groupChatId))
      .eq("tg_user_id", Number(r.tg_user_id));

    if (uErr) console.error("[tg] reminder update failed:", uErr);
  }
}

// Auto-kick expired pending joins (no cron — runs on any webhook)
async function maybeEnforceGraceExpiry() {
  const nowIso = new Date().toISOString();

  const { data: rows, error } = await supabaseAdmin
    .from("dd_tg_pending_joins")
    .select("group_chat_id,tg_user_id,grace_expires_at,status")
    .eq("status", "PENDING")
    .lte("grace_expires_at", nowIso)
    .limit(25);

  if (error) {
    console.error("[tg] expiry query failed:", error);
    return;
  }
  if (!rows || rows.length === 0) return;

  for (const r of rows as any[]) {
    const groupChatId = Number(r.group_chat_id);
    const tgUserId = Number(r.tg_user_id);

    await kickMember(groupChatId, tgUserId, "grace_expired");

    const { error: uErr } = await supabaseAdmin
      .from("dd_tg_pending_joins")
      .update({ status: "REMOVED", reminded_at: new Date().toISOString() })
      .eq("group_chat_id", String(groupChatId))
      .eq("tg_user_id", tgUserId);

    if (uErr) console.error("[tg] expiry update failed:", uErr);
  }
}

// Auto-unrestrict verified users (checks dd_tg_verify_codes used_at not null)
async function maybeAutoUnrestrictVerified() {
  const nowIso = new Date().toISOString();

  const { data: rows, error } = await supabaseAdmin
    .from("dd_tg_pending_joins")
    .select("group_chat_id,tg_user_id,grace_expires_at,status")
    .eq("status", "PENDING")
    .gt("grace_expires_at", nowIso)
    .limit(25);

  if (error) {
    console.error("[tg] pending query failed:", error);
    return;
  }
  if (!rows || rows.length === 0) return;

  for (const r of rows as any[]) {
    const groupChatId = Number(r.group_chat_id);
    const tgUserId = Number(r.tg_user_id);

    const { data: links, error: linkErr } = await supabaseAdmin
      .from("dd_tg_verify_codes")
      .select("terminal_user_id, used_at")
      .eq("tg_user_id", tgUserId)
      .not("used_at", "is", null)
      .order("used_at", { ascending: false })
      .limit(1);

    if (linkErr) {
      console.error("[tg] verify check failed:", linkErr);
      continue;
    }

    const terminalUserId = (links?.[0] as any)?.terminal_user_id;
    if (!terminalUserId) continue;

    await unrestrictMember(groupChatId, tgUserId);

    const { error: uErr } = await supabaseAdmin
      .from("dd_tg_pending_joins")
      .update({ status: "VERIFIED", reminded_at: new Date().toISOString() })
      .eq("group_chat_id", String(groupChatId))
      .eq("tg_user_id", tgUserId);

    if (uErr) console.error("[tg] verified update failed:", uErr);

    try {
      await sendMessage(groupChatId, `✅ Verified: <a href="tg://user?id=${tgUserId}">member</a>`);
    } catch { }
  }
}

function adminIdSet(): Set<number> {
  const raw = envOptional("TG_ADMIN_USER_IDS")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const out = new Set<number>();
  for (const s of raw) {
    const n = Number(s);
    if (Number.isFinite(n) && n > 0) out.add(n);
  }
  return out;
}

function isAdminUser(tgUserId: number): boolean {
  const set = adminIdSet();
  return set.size > 0 && set.has(tgUserId);
}

async function lookupTgUserLabel(tgUserId: number): Promise<string> {
  const { data } = await supabaseAdmin
    .from("dd_tg_chats")
    .select("title, username")
    .eq("chat_id", String(tgUserId))
    .limit(1);

  const row = (data?.[0] as any) ?? null;
  if (!row) return `TG:${tgUserId}`;
  if (row.username) return `@${row.username}`;
  if (row.title) return String(row.title);
  return `TG:${tgUserId}`;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** --- Moderation heuristics (simple + effective) --- */

const ALLOWLIST_DOMAINS = ["digdug.do", "t.me/digsterbot", "t.me/digdugdo", "bscscan.com/tx/"];

function containsLink(text: string, msg: any): boolean {
  const t = text || "";
  if (/(https?:\/\/|www\.)/i.test(t)) return true;
  if (/(t\.me\/|telegram\.me\/)/i.test(t)) return true;

  const ents = [...(msg?.entities ?? []), ...(msg?.caption_entities ?? [])];
  for (const e of ents) {
    if (e?.type === "url" || e?.type === "text_link") return true;
  }
  return false;
}

function allowlistedLink(text: string): boolean {
  const s = (text || "").toLowerCase();
  return ALLOWLIST_DOMAINS.some((d) => s.includes(d));
}

function looksScammy(text: string): boolean {
  const s = (text || "").toLowerCase();
  const flags = [
    "airdrop",
    "claim now",
    "claim your",
    "bonus",
    "support",
    "customer support",
    "verify wallet",
    "connect wallet",
    "seed phrase",
    "private key",
    "urgent",
    "limited time",
    "free usdt",
    "free token",
    "giveaway",
    "whitelist",
  ];
  return flags.some((f) => s.includes(f));
}

function isCommandAllowlisted(text: string): boolean {
  const t = (text || "").trim();
  if (!t.startsWith("/")) return false;
  const cmd = t.split(/\s+/)[0].toLowerCase();
  const ok = new Set([
    "/ask",
    "/ask@digsterbot",
    "/paid",
    "/paid@digsterbot",
    "/claim",
    "/claim@digsterbot",
    "/ping",
    "/ping@digsterbot",
    "/chatid",
    "/chatid@digsterbot",
    "/help",
    "/start",
  ]);
  return ok.has(cmd);
}

async function isVerifiedTgUser(tgUserId: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("dd_tg_verify_codes")
    .select("terminal_user_id, used_at")
    .eq("tg_user_id", tgUserId)
    .not("used_at", "is", null)
    .order("used_at", { ascending: false })
    .limit(1);

  if (error) return false;
  return !!(data?.[0] as any)?.terminal_user_id;
}

async function isPendingInThisGroup(groupChatId: number, tgUserId: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("dd_tg_pending_joins")
    .select("status")
    .eq("group_chat_id", String(groupChatId))
    .eq("tg_user_id", tgUserId)
    .limit(1);

  if (error) return false;
  return String((data?.[0] as any)?.status || "") === "PENDING";
}

/** Join processing (restrict + store + welcome) */
async function processJoin(groupChatId: number, user: any, source: "chat_member" | "new_chat_members") {
  const tgUserId = Number(user?.id);
  if (!tgUserId) return;

  // Auto-ban bots
  if (user?.is_bot) {
    await banMember(groupChatId, tgUserId, "bot_join");
    return;
  }

  const graceMinutes = 10;
  const graceExpiresAt = new Date(Date.now() + graceMinutes * 60 * 1000).toISOString();

  // De-dupe welcome spam: if warned_at exists very recently, skip sending another welcome
  const { data: existing } = await supabaseAdmin
    .from("dd_tg_pending_joins")
    .select("warned_at,status")
    .eq("group_chat_id", String(groupChatId))
    .eq("tg_user_id", tgUserId)
    .limit(1);

  const warnedAt = (existing?.[0] as any)?.warned_at ? new Date((existing?.[0] as any).warned_at) : null;
  const alreadyWarnedRecently = warnedAt ? Date.now() - warnedAt.getTime() < 90 * 1000 : false;

  // Upsert pending join record
  const { error } = await supabaseAdmin
    .from("dd_tg_pending_joins")
    .upsert(
      {
        group_chat_id: String(groupChatId),
        tg_user_id: tgUserId,
        grace_expires_at: graceExpiresAt,
        warned_at: new Date().toISOString(),
        status: "PENDING",
      },
      { onConflict: "group_chat_id,tg_user_id" }
    );

  if (error) console.error("[tg] pending join upsert error:", source, error);

  // Restrict immediately until verified
  await restrictMember(groupChatId, tgUserId);

  if (!alreadyWarnedRecently) {
    await sendMessage(groupChatId, welcomeText(user?.first_name, graceMinutes), { replyMarkup: verifyButton() });
  }
}

export async function GET() {
  return new Response("Telegram webhook OK", { status: 200 });
}

/**
 * IMPORTANT: ACK FAST.
 * Telegram expects a quick 200 OK. We do all work in background to avoid timeouts.
 */
export async function POST(req: NextRequest) {
  const update = await req.json();

  // Priority commands must run inline (Vercel may kill background work)
  const text = getText(update);
  const isPriorityCmd = /^\/(paid|claim|verify|usdt|ask|ping|chatid|start|help)(@|\b)/i.test(text);

  if (isPriorityCmd) {
    await handleUpdate(update);
    return NextResponse.json({ ok: true });
  }

  // Everything else can run best-effort in background
  runInBackground(async () => {
    await handleUpdate(update);
  });

  return NextResponse.json({ ok: true });
}

async function handleUpdate(update: any) {
  // Persist chat metadata on ANY update
  const chatAny: TgChat | undefined =
    update?.message?.chat ??
    update?.edited_message?.chat ??
    update?.channel_post?.chat ??
    update?.edited_channel_post?.chat ??
    update?.my_chat_member?.chat ??
    update?.chat_member?.chat ??
    update?.callback_query?.message?.chat;

  if (chatAny?.id && chatAny?.type) {
    await upsertTgChat(chatAny);
  }

  // Opportunistic sweeps (no cron required)
  await maybeAutoUnrestrictVerified();
  await maybeSendGraceExpiryReminders();
  await maybeEnforceGraceExpiry();

  const text = getText(update);
  const chat = getChat(update);
  const chatId = getChatId(update);

  // Join detection via chat_member updates
  const cm = update?.chat_member;
  const cmChat = cm?.chat;
  const cmNew = cm?.new_chat_member;
  const cmStatus = cmNew?.status;
  const cmUser = cmNew?.user;

  if (cmChat?.id && (cmChat?.type === "group" || cmChat?.type === "supergroup") && cmUser?.id && cmStatus === "member") {
    await processJoin(Number(cmChat.id), cmUser, "chat_member");
    return;
  }

  if (!chatId) return;

  /** --- Group anti-spam/moderation (runs before commands) --- */
  const msg = getMsg(update);
  const isGroup = chat?.type === "group" || chat?.type === "supergroup";
  const u = fromUser(update);
  const tgUserId = u?.id ? Number(u.id) : null;

  if (isGroup && msg && tgUserId) {
    const isAdmin = isAdminUser(tgUserId);

    // Handle new_chat_members join messages (also restrict + welcome)
    const newMembers = msg?.new_chat_members;
    if (newMembers && Array.isArray(newMembers) && newMembers.length > 0) {
      for (const m of newMembers) {
        await processJoin(chatId, m, "new_chat_members");
      }
      return;
    }

    // Basic spam filter (ignore admin + allowlisted commands)
    const t = String(text || "");
    const commandOk = isCommandAllowlisted(t);
    if (!isAdmin && !commandOk) {
      const hasLink = containsLink(t, msg);
      const scam = looksScammy(t);

      // Determine user state
      const pending = await isPendingInThisGroup(chatId, tgUserId);
      const verified = await isVerifiedTgUser(tgUserId);

      // Unverified (pending or not verified) + any link => delete + ban (strict)
      if (!verified && (pending || true) && hasLink && !allowlistedLink(t)) {
        await deleteMessage(chatId, Number(msg.message_id));
        await banMember(chatId, tgUserId, "unverified_link");
        return;
      }

      // Scammy content + link => delete + ban
      if ((hasLink && scam) && !allowlistedLink(t)) {
        await deleteMessage(chatId, Number(msg.message_id));
        await banMember(chatId, tgUserId, "scam_link");
        return;
      }

      // Verified users: links are allowed only if allowlisted; otherwise delete + warn
      if (verified && hasLink && !allowlistedLink(t)) {
        await deleteMessage(chatId, Number(msg.message_id));
        const who = mentionUserHtml(tgUserId, displayName(update));
        await sendMessage(chatId, `⚠️ ${who} links are restricted here. Use DIGDUG.DO links only.`);
        return;
      }
    }
  }

  /** --- Existing command handlers below (unchanged) --- */

  // /ask
  if (text === "/ask" || text.startsWith("/ask ") || text.startsWith("/ask@")) {
    const firstSpace = text.indexOf(" ");
    const qRaw = firstSpace >= 0 ? text.slice(firstSpace + 1).trim() : "";

    if (!qRaw) {
      await sendMessage(chatId, "Usage: /ask your question");
      return;
    }

    try {
      const q = `${qRaw}\n\n(Answer for Telegram: max 8 short lines. Keep it punchy. Include up to 2 source paths.)`;
      const result = await askBrain(q);

      let out = String(result.answer || "").trim();
      if (!out) out = "No answer returned.";

      out = out.split("\n").slice(0, 8).join("\n");
      if (out.length > 3500) out = out.slice(0, 3500) + "\n…";

      const header = `<b>Digster AI</b> (v${result.build?.version ?? "?"})\n`;
      await sendMessage(chatId, header + escapeHtml(out));
      return;
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : "Unknown error";
      await sendMessage(chatId, `⚠️ Brain error: ${escapeHtml(msg)}`);
      return;
    }
  }

  // ✅ ADMIN /paid (GROUP ONLY)
  if (text === "/paid" || text.startsWith("/paid ")) {
    const u = fromUser(update);
    const tgUserId = u?.id;
    const who = displayName(update);
    const isGroup = chat?.type === "group" || chat?.type === "supergroup";

    if (!isGroup) {
      await sendMessage(chatId, "Usage: /paid GF-XXXX 0xTXHASH (group only)");
      return;
    }

    if (!tgUserId || !isAdminUser(Number(tgUserId))) {
      await sendMessage(chatId, `❌ ${who}: unauthorized.`);
      return;
    }

    const parts = text.split(/\s+/).filter(Boolean);
    const claimCode = String(parts[1] ?? "").trim().toUpperCase();
    const txIn = String(parts[2] ?? "").trim();

    if (!claimCode.startsWith("GF-")) {
      await sendMessage(chatId, "Usage: /paid GF-XXXX 0xTXHASH");
      return;
    }
    if (!txIn || !looksLikeTxHash(txIn)) {
      await sendMessage(chatId, "Usage: /paid GF-XXXX 0xTXHASH (or bscscan link)");
      return;
    }

    const { txHash, txUrl } = extractTxHashOrLink(txIn);
    if (!txHash || !txUrl) {
      await sendMessage(chatId, "Invalid tx hash/link.");
      return;
    }

    const { data: evRows, error: evErr } = await supabaseAdmin
      .from("dd_tg_golden_events")
      .select("id, token, chain, usd_value")
      .eq("claim_code", claimCode)
      .limit(1);

    if (evErr) {
      console.error("[paid] event lookup failed:", evErr);
      await sendMessage(chatId, "Server error. Try again.");
      return;
    }

    const ev = (evRows?.[0] as any) ?? null;
    if (!ev?.id) {
      await sendMessage(chatId, `Claim code not found: ${claimCode}`);
      return;
    }

    const { data: claimRows, error: cErr } = await supabaseAdmin
      .from("dd_tg_golden_claims")
      .select("id, tg_user_id, group_chat_id, payout_usdt_bep20, paid_at, paid_tx_hash")
      .eq("golden_event_id", ev.id)
      .order("claimed_at", { ascending: false })
      .limit(1);

    if (cErr) {
      console.error("[paid] claim lookup failed:", cErr);
      await sendMessage(chatId, "Server error. Try again.");
      return;
    }

    const claim = (claimRows?.[0] as any) ?? null;
    if (!claim?.id) {
      await sendMessage(chatId, `No claim found for ${claimCode} (not claimed yet).`);
      return;
    }

    const nowIso = new Date().toISOString();
    const { error: uErr } = await supabaseAdmin
      .from("dd_tg_golden_claims")
      .update({
        paid_at: nowIso,
        paid_tx_hash: txHash,
        paid_by_tg_user_id: Number(tgUserId),
      })
      .eq("id", claim.id);

    if (uErr) {
      console.error("[paid] update failed:", uErr);
      await sendMessage(chatId, "Could not mark as paid (server error).");
      return;
    }

    const winnerLabel = await lookupTgUserLabel(Number(claim.tg_user_id));
    const maskedAddr = claim.payout_usdt_bep20 ? maskEvmAddress(String(claim.payout_usdt_bep20)) : "N/A";

    await sendMessage(
      chatId,
      `✅ <b>PAID</b>\n` +
      `Claim: <b>${claimCode}</b>\n` +
      `Winner: <b>${winnerLabel}</b>\n` +
      `Payout: <code>${maskedAddr}</code>\n` +
      `Token: ${ev.token} (${ev.chain})\n` +
      `Value: $${Number(ev.usd_value).toFixed(2)}\n` +
      `TX: ${txUrl}`
    );

    try {
      await sendMessageChecked(Number(claim.tg_user_id), `✅ Payment sent.\n\nClaim: ${claimCode}\nTX: ${txUrl}\n\nThank you for testing DIGDUG.DO.`);
    } catch { }

    return;
  }

  // /verify (DM only)
  if ((text === "/verify" || text.startsWith("/verify ")) && chat?.type === "private") {
    const tgUserId = fromUser(update)?.id;

    if (!tgUserId) {
      await sendMessage(chatId, "Unable to identify your Telegram user.");
      return;
    }

    const code = generateVerifyCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabaseAdmin.from("dd_tg_verify_codes").insert({
      tg_user_id: tgUserId,
      code,
      expires_at: expiresAt,
    });

    if (error) {
      console.error("[verify] insert failed:", error);
      await sendMessage(chatId, "Failed to generate verification code. Try again.");
      return;
    }

    await sendMessage(
      chatId,
      `Terminal Pass Verification

Your verification code:
<b>${code}</b>

Expires in 10 minutes.

Go to https://digdug.do
Open the Terminal and type:

<code>verify ${code}</code>`
    );

    return;
  }

  // /claim (DM OR GROUP)
  if (text === "/claim" || text.startsWith("/claim ")) {
    const u = fromUser(update);
    const tgUserId = u?.id;
    const who = displayName(update);
    const isGroup = chat?.type === "group" || chat?.type === "supergroup";

    if (!tgUserId) {
      await sendMessage(chatId, "Unable to identify your Telegram user.");
      return;
    }

    const parts = text.split(/\s+/).filter(Boolean);
    const claimCode = String(parts[1] ?? "").trim().toUpperCase();

    if (!claimCode || !claimCode.startsWith("GF-")) {
      await sendMessage(chatId, "Usage: /claim GF-XXXX");
      return;
    }

    if (isGroup) {
      await sendMessage(chatId, `🏆 Claim attempt received: <b>${claimCode}</b> from <b>${who}</b>`);
    }

    const { data: links, error: linkErr } = await supabaseAdmin
      .from("dd_tg_verify_codes")
      .select("terminal_user_id")
      .eq("tg_user_id", tgUserId)
      .not("used_at", "is", null)
      .order("used_at", { ascending: false })
      .limit(1);

    if (linkErr) {
      console.error("[claim] verify lookup failed:", linkErr);
      if (isGroup) await sendMessage(chatId, `❌ ${who}: claim failed (server error).`);
      else await sendMessage(chatId, "Claim failed (server error). Try again later.");
      return;
    }

    const terminalUserId = (links?.[0] as any)?.terminal_user_id;

    if (!terminalUserId) {
      const msg = `Verification required.

Step 1: DM @DigsterBot and type <code>/verify</code>
Step 2: enter the code in the Terminal:
<code>verify DG-XXXX</code>

Then retry:
<code>/claim ${claimCode}</code>`;

      try {
        await sendMessageChecked(Number(tgUserId), msg);
      } catch {
        await sendMessage(chatId, `⚠️ ${who}: you must verify first. DM @DigsterBot and run <code>/verify</code>.`);
      }

      return;
    }

    const { data: evRows, error: evErr } = await supabaseAdmin
      .from("dd_tg_golden_events")
      .select("id, terminal_user_id, token, chain, usd_value")
      .eq("claim_code", claimCode)
      .limit(1);

    if (evErr) {
      console.error("[claim] event lookup failed:", evErr);
      await sendMessage(chatId, `❌ ${who}: claim failed (server error).`);
      return;
    }

    const ev = evRows?.[0] as any;
    if (!ev?.id) {
      await sendMessage(chatId, `❌ ${who}: claim code not found.`);
      return;
    }

    if (String(ev.terminal_user_id) !== String(terminalUserId)) {
      await sendMessage(chatId, `❌ ${who}: claim rejected (not your verified Terminal Pass).`);
      return;
    }

    const { error: insErr } = await supabaseAdmin.from("dd_tg_golden_claims").insert({
      golden_event_id: ev.id,
      tg_user_id: tgUserId,
      terminal_user_id: terminalUserId,
      group_chat_id: isGroup ? String(chatId) : null,
    });

    if (insErr) {
      const m = String((insErr as any)?.message ?? "").toLowerCase();
      if (m.includes("duplicate") || m.includes("unique")) {
        if (isGroup) {
          const { error: fixErr } = await supabaseAdmin
            .from("dd_tg_golden_claims")
            .update({ group_chat_id: String(chatId) })
            .eq("golden_event_id", ev.id)
            .eq("tg_user_id", tgUserId)
            .is("group_chat_id", null);

          if (fixErr) console.error("[claim] group_chat_id backfill failed:", fixErr);
        }

        await sendMessage(chatId, `ℹ️ ${who}: already claimed. Check DM for payout step.`);
        return;
      }

      console.error("[claim] insert failed:", insErr);
      await sendMessage(chatId, `❌ ${who}: claim failed (server error).`);
      return;
    }

    const dm = `✅ Claim accepted.

Claim: ${claimCode}
Token: ${ev.token} (${ev.chain})
Value: $${Number(ev.usd_value).toFixed(2)}

NEXT:
Reply here with your payout address (USDT BEP-20) using:

<code>/usdt 0xYOURADDRESS</code>

After payment, you will receive a receipt confirmation.`;

    try {
      await sendMessageChecked(Number(tgUserId), dm);
      await sendMessage(chatId, `✅ ${who}: claim validated. Check DM for payout step.`);
    } catch {
      await sendMessage(chatId, `✅ ${who}: claim validated, but I couldn't DM you. Please DM @DigsterBot and send <code>/start</code>, then try again.`);
    }

    return;
  }

  // /usdt (DM only)
  if ((text === "/usdt" || text.startsWith("/usdt ")) && chat?.type === "private") {
    const tgUserId = fromUser(update)?.id;

    if (!tgUserId) {
      await sendMessage(chatId, "Unable to identify your Telegram user.");
      return;
    }

    const parts = text.split(/\s+/).filter(Boolean);
    const addr = String(parts[1] ?? "").trim();

    if (!addr || !looksLikeEvmAddress(addr)) {
      await sendMessage(chatId, "Usage: /usdt 0xYOURADDRESS (USDT BEP-20)");
      return;
    }

    const { data: claims, error: cErr } = await supabaseAdmin
      .from("dd_tg_golden_claims")
      .select("id, claimed_at, group_chat_id, golden_event_id")
      .eq("tg_user_id", tgUserId)
      .order("claimed_at", { ascending: false })
      .limit(1);

    if (cErr) {
      console.error("[usdt] claim lookup failed:", cErr);
      await sendMessage(chatId, "Could not store address (server error). Try again later.");
      return;
    }

    const claim = claims?.[0] as any;
    if (!claim?.id) {
      await sendMessage(chatId, "No recent claim found. Claim a Golden Find first using /claim GF-XXXX.");
      return;
    }

    const { error: uErr } = await supabaseAdmin.from("dd_tg_golden_claims").update({ payout_usdt_bep20: addr }).eq("id", claim.id);

    if (uErr) {
      console.error("[usdt] update failed:", uErr);
      await sendMessage(chatId, "Could not store address (server error). Try again later.");
      return;
    }

    const masked = maskEvmAddress(addr);

    await sendMessage(chatId, `Payout address saved.\n\nUSDT (BEP-20): ${addr}\n\nWe will pay and then send you a receipt confirmation.`);

    if (claim?.group_chat_id) {
      try {
        const who = displayName(update);
        await sendMessage(Number(claim.group_chat_id), `✅ Payout address received for <b>${who}</b>: <code>${masked}</code>`);
      } catch (e) {
        console.error("[usdt] public confirm failed:", e);
      }
    }

    return;
  }

  // /start
  if (text === "/start" || text.startsWith("/start ")) {
    await sendMessage(
      chatId,
      `Welcome to DIGSTER

Commands (DM):
- /verify
- /claim GF-XXXX
- /usdt 0xYOURADDRESS (USDT BEP-20)

Group:
- /claim GF-XXXX (public validation)
- /paid GF-XXXX 0xTXHASH (admin)
- /ping
- /chatid`
    );
    return;
  }

  // /help
  if (text === "/help") {
    await sendMessage(
      chatId,
      `Commands:\n/verify\n/claim GF-XXXX\n/usdt 0xYOURADDRESS\n\nGroup:\n/claim GF-XXXX (public validation)\n/paid GF-XXXX 0xTXHASH (admin)\n/ping\n/chatid`
    );
    return;
  }

  // /ping
  if (text === "/ping" || text.startsWith("/ping@")) {
    const type = chat?.type ?? "unknown";
    const title = chat?.title ? ` • ${chat.title}` : "";
    await sendMessage(chatId, `Digster online${title}\nchat_type=${type}`);
    return;
  }

  // /chatid
  if (text === "/chatid" || text.startsWith("/chatid@")) {
    const type = chat?.type ?? "unknown";
    const title = chat?.title ? `\ntitle=${chat.title}` : "";
    const msg = getMsg(update);
    const threadId = msg?.message_thread_id ?? null;
    const threadLine = threadId ? `\nmessage_thread_id=${threadId}` : "";
    await sendMessage(chatId, `chat_id=${chatId}\nchat_type=${type}${title}${threadLine}`);
    return;
  }

  return;
}
