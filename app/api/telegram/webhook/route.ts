import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

async function sendMessage(chatId: number, text: string) {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "HTML",
            disable_web_page_preview: true,
        }),
    });
}

import { createClient } from "@supabase/supabase-js";

function reqEnv(name: string) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

// Service-role Supabase client (server-only)
const supabaseAdmin = createClient(
    reqEnv("SUPABASE_URL"),
    reqEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
        auth: { persistSession: false },
    }
);

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
    // Telegram chat IDs can be large; send as string so Postgres bigint can cast safely
    const chat_id = String(chat.id);

    const payload = {
        chat_id, // bigint in DB; string here is OK (Postgres casts)
        chat_type: chat.type ?? null,
        title: chatDisplayTitle(chat),
        username: chat.username ?? null,
        last_seen_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
        .from("dd_tg_chats")
        .upsert(payload, { onConflict: "chat_id" });

    if (error) {
        // Don't break the bot on persistence failures — just log
        console.error("[tg] dd_tg_chats upsert error:", error);
    }
}

function getMsg(update: any) {
    return update?.message ?? update?.edited_message ?? null;
}

function getText(update: any): string {
    const msg = getMsg(update);
    return String(msg?.text ?? "").trim();
}

function getChat(update: any) {
    const msg = getMsg(update);
    return msg?.chat ?? null;
}

function getChatId(update: any): number | null {
    const chat = getChat(update);
    return typeof chat?.id === "number" ? chat.id : null;
}

function generateVerifyCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "DG-";
    for (let i = 0; i < 4; i++) {
        out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
}

export async function GET() {
    return new Response("Telegram webhook OK", { status: 200 });
}

export async function POST(req: NextRequest) {
    const update = await req.json();

    // --- STEP 2B: persist chat metadata on ANY update ---
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

    const text = getText(update);
    const chat = getChat(update);
    const chatId = getChatId(update);

    console.log("TG UPDATE:", {
        chatId,
        chatType: chat?.type,
        title: chat?.title,
        text,
    });

    if (!chatId) return NextResponse.json({ ok: true });

    const DEBUG = false;

    if (DEBUG && text.startsWith("/")) {
        await sendMessage(chatId, `DEBUG ✅ got: <code>${text}</code>\nchat_id=<code>${chatId}</code>`);
    }

    // ✅ /verify (DM only)
    if ((text === "/verify" || text.startsWith("/verify ")) && chat?.type === "private") {
        const tgUserId = update?.message?.from?.id;

        if (!tgUserId) {
            await sendMessage(chatId, "❌ Unable to identify your Telegram user.");
            return NextResponse.json({ ok: true });
        }

        const code = generateVerifyCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        const { error } = await supabaseAdmin
            .from("dd_tg_verify_codes")
            .insert({
                tg_user_id: tgUserId,
                code,
                expires_at: expiresAt,
            });

        if (error) {
            console.error("[verify] insert failed:", error);
            await sendMessage(chatId, "❌ Failed to generate verification code. Try again.");
            return NextResponse.json({ ok: true });
        }

        await sendMessage(
            chatId,
            `🔐 <b>Terminal Pass Verification</b>

Your verification code:
<b>${code}</b>

⏳ Expires in 10 minutes.

Go to https://digdug.do
Open the Terminal and type:

<code>/verify ${code}</code>`
        );

        return NextResponse.json({ ok: true });
    }

    // ✅ /start (DM onboarding)
    if (text === "/start" || text.startsWith("/start ")) {
        await sendMessage(
            chatId,
            `👋 <b>Welcome to DIGSTER</b>

This bot is the official companion for <b>DIGDUG.DO</b>.

🔐 Phase Zero:
1) Go to https://digdug.do
2) Claim a Terminal Pass
3) Use this bot for announcements + verification

Type <b>/help</b> to see commands.`
        );
        return NextResponse.json({ ok: true });
    }

    // ✅ /help
    if (text === "/help") {
        await sendMessage(
            chatId,
            `Commands:
• /ping — bot health check
• /chatid — show this chat id (admin use)
• /help — commands`
        );
        return NextResponse.json({ ok: true });
    }

    // ✅ /ping (works in groups even with privacy mode)
    if (text === "/ping" || text.startsWith("/ping@")) {
        const type = chat?.type ?? "unknown";
        const title = chat?.title ? ` • ${chat.title}` : "";
        await sendMessage(chatId, `✅ Digster online${title}\nchat_type=${type}`);
        return NextResponse.json({ ok: true });
    }

    // ✅ /chatid (so we can capture the supergroup chat id)
    if (text === "/chatid" || text.startsWith("/chatid@")) {
        const type = chat?.type ?? "unknown";
        const title = chat?.title ? `\ntitle=${chat.title}` : "";
        await sendMessage(chatId, `chat_id=${chatId}\nchat_type=${type}${title}`);
        return NextResponse.json({ ok: true });
    }

    // ✅ User joined group (NEW-ONLY SOFT GATE)
    const msg = getMsg(update);
    const newMembers = msg?.new_chat_members;

    if (newMembers && Array.isArray(newMembers) && newMembers.length > 0) {
        // only enforce in groups/supergroups
        if (chat?.type === "group" || chat?.type === "supergroup") {
            const graceMinutes = 10;
            const graceExpiresAt = new Date(Date.now() + graceMinutes * 60 * 1000).toISOString();

            for (const m of newMembers) {
                const tgUserId = m?.id;
                const isBot = !!m?.is_bot;

                // Never gate bots (including ourselves)
                if (!tgUserId || isBot) continue;

                // Insert / upsert pending join record
                const { error } = await supabaseAdmin
                    .from("dd_tg_pending_joins")
                    .upsert(
                        {
                            group_chat_id: String(chatId),
                            tg_user_id: tgUserId,
                            grace_expires_at: graceExpiresAt,
                            warned_at: new Date().toISOString(),
                            status: "PENDING",
                        },
                        { onConflict: "group_chat_id,tg_user_id" }
                    );

                if (error) {
                    console.error("[tg] pending join upsert error:", error);
                }

                // Warn message (soft gate)
                const first = m?.first_name ? ` ${m.first_name}` : "";
                await sendMessage(
                    chatId,
                    `👋 Welcome${first}.

🔐 <b>Verification required</b> (Phase Zero testers only)

You have <b>${graceMinutes} minutes</b> to verify your Terminal Pass or you will be removed.

✅ Step 1: DM @DigsterBot and type <b>/verify</b>
✅ Step 2: Go to https://digdug.do and type the code in Terminal:
<code>verify DG-XXXX</code>`
                );
            }

            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ ok: true });
    }

