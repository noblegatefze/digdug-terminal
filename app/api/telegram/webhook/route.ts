import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// Basic helper to send messages
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

export async function GET() {
  return new Response("Telegram webhook OK", { status: 200 });
}

export async function POST(req: NextRequest) {
  const update = await req.json();

  // 1️⃣ Private chat: /start
  if (update.message?.text === "/start") {
    const chatId = update.message.chat.id;

    await sendMessage(
      chatId,
      `⛏ <b>Welcome to DIGSTER</b>

This bot is the official companion for <b>DIGDUG.DO</b>.

🔐 To participate in the testnet:
1. Visit https://digdug.do
2. Get your Terminal Pass
3. Join the DIGDUG Telegram group

⚠️ Phase Zero:
- Manual rewards
- Test protocol
- Limited Golden Finds daily

Good luck, Digger.`
    );

    return NextResponse.json({ ok: true });
  }

  // 2️⃣ User joined group
  if (update.message?.new_chat_members) {
    const chatId = update.message.chat.id;

    await sendMessage(
      chatId,
      `👋 Welcome.

This is a <b>closed test group</b>.

🔑 Access requires a <b>Terminal Pass</b>.
Visit: https://digdug.do

You have a limited time to verify before removal.`
    );

    return NextResponse.json({ ok: true });
  }

  // 3️⃣ Ignore everything else for now
  return NextResponse.json({ ok: true });
}
