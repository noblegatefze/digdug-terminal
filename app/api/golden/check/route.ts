import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function reqEnv(name: string) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

const supabaseAdmin = createClient(
    reqEnv("SUPABASE_URL"),
    reqEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
);

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://digdug.do";
const ADMIN_KEY = reqEnv("ADMIN_API_KEY");

// Golden Find rules
const GOLD_MIN = 5;
const GOLD_MAX = 20;
const DAILY_CAP = 5;

function todayUTC(): string {
    return new Date().toISOString().slice(0, 10);
}

function buildMessage(p: {
    token: string;
    chain: string;
    usd: number;
}) {
    return [
        "GOLDEN FIND",
        "",
        `A tester just uncovered a GOLDEN FIND`,
        `Token: ${p.token} (${p.chain})`,
        `Reward value: $${p.usd.toFixed(2)}`,
        "",
        "Sponsored by ToastPunk",
        "",
        "Digging continues."
    ].join("\n");
}

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
    }

    const usdValue = Number(body.usd_value);
    const token = String(body.token ?? "");
    const chain = String(body.chain ?? "");

    if (!Number.isFinite(usdValue) || usdValue < GOLD_MIN || usdValue > GOLD_MAX) {
        return NextResponse.json({ ok: true, golden: false, reason: "out_of_range" });
    }

    const day = todayUTC();

    // 1) Atomically take a daily slot (prevents race conditions)
    type GoldenSlot = { allowed: boolean; new_count: number };

    const { data: slot, error: slotErr } = await supabaseAdmin
        .rpc("dd_take_golden_slot", { p_day: day, p_cap: DAILY_CAP })
        .single<GoldenSlot>();

    if (slotErr) {
        console.error("[golden] slot rpc failed:", slotErr);
        return NextResponse.json({ ok: false, error: "slot_rpc_failed" }, { status: 500 });
    }

    if (!slot?.allowed) {
        return NextResponse.json({ ok: true, golden: false, reason: "daily_cap_reached" });
    }

    // 3) Broadcast
    const message = buildMessage({ token, chain, usd: usdValue });

    const br = await fetch(`${SITE}/api/admin/telegram/broadcast`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-admin-key": ADMIN_KEY
        },
        body: JSON.stringify({
            mode: "send",
            message,
            includeTypes: ["supergroup"],
            maxSend: 1,
            delayMs: 400
        })
    });

    const out = await br.json().catch(() => ({}));

    return NextResponse.json({
        ok: true,
        golden: true,
        broadcast: out
    });
}
