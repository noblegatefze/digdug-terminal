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

    // ✅ User joined group
    if (getMsg(update)?.new_chat_members) {
        await sendMessage(
            chatId,
            `👋 Welcome.

This is a <b>closed test group</b> for Phase Zero.

🔑 Access requires a <b>Terminal Pass</b> from https://digdug.do

Type <b>/help</b> for commands.`
        );
        return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
}
