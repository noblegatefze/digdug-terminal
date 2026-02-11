import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const sb = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

const CHALLENGE_TTL_MS = 2 * 60_000; // 2 min
const MAX_ATTEMPTS = 4;

function norm(s: string) {
  return (s ?? "").trim().toLowerCase();
}
function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}
function randInt(a: number, b: number) {
  return Math.floor(a + Math.random() * (b - a + 1));
}

type CaptchaQ = { question: string; answer: string };

function makeCaptchaQuestion(): CaptchaQ {
  const kind = randInt(1, 4);

  if (kind === 1) {
    const a = randInt(7, 19);
    const b = randInt(3, 12);
    const c = randInt(2, 9);
    return {
      question: `Solve: (${a} + ${b}) × ${c}  (numbers only)`,
      answer: String((a + b) * c),
    };
  }

  if (kind === 2) {
    const pool = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const s = Array.from({ length: 5 }, () => pool[randInt(0, pool.length - 1)]).join("");
    return {
      question: `Type this BACKWARDS: ${s}`,
      answer: s.split("").reverse().join(""),
    };
  }

  if (kind === 3) {
    const ch = ["@", "#", "$", "%", "&"][randInt(0, 4)];
    const n = randInt(6, 12);
    const noise = Array.from({ length: n }, () => (Math.random() < 0.45 ? ch : ".")).join("");
    return {
      question: `How many '${ch}' in: ${noise}  (answer is a number)`,
      answer: String(noise.split(ch).length - 1),
    };
  }

  const seqs = ["qwe", "asd", "zxc", "poi", "jkl", "mnb"];
  const base = seqs[randInt(0, seqs.length - 1)];
  const reps = randInt(2, 4);
  const shown = Array.from({ length: reps }, () => base).join("-");
  return { question: `Type exactly: ${shown}`, answer: shown };
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as any;

  const purpose = String(body?.purpose ?? "").toUpperCase();
  const username = String(body?.username ?? "").trim();
  const install_id = String(body?.install_id ?? "").trim();

  if (purpose !== "REGISTER" && purpose !== "DIG") {
    return NextResponse.json({ ok: false, error: "bad_purpose" }, { status: 400 });
  }
  if (!username || username.length < 3) {
    return NextResponse.json({ ok: false, error: "bad_username" }, { status: 400 });
  }
  if (!install_id || install_id.length < 6) {
    return NextResponse.json({ ok: false, error: "bad_install_id" }, { status: 400 });
  }

  const q = makeCaptchaQuestion();
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();

  const answerHash = sha256(`${norm(q.answer)}|${username}|${install_id}|${purpose}`);

  const { data, error } = await sb
    .from("dd_captcha_challenges")
    .insert({
      purpose,
      username,
      install_id,
      question: q.question,
      answer_hash: answerHash,
      expires_at: expiresAt,
      max_attempts: MAX_ATTEMPTS,
    })
    .select("id, expires_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    challenge_id: data.id,
    question: `CAPTCHA: ${q.question}`,
    expires_at: data.expires_at,
    max_attempts: MAX_ATTEMPTS,
  });
}
