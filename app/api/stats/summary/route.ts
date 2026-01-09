import { NextResponse } from "next/server";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function GET() {
  try {
    const url = env("SUPABASE_URL");
    const key = env("SUPABASE_SERVICE_ROLE_KEY");

    const r = await fetch(`${url}/rest/v1/rpc/stats_summary`, {
      method: "POST",
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return NextResponse.json({ ok: false, error: "rpc_failed", detail: txt.slice(0, 200) }, { status: 500 });
    }

    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "server_error" }, { status: 500 });
  }
}
