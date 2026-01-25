"use client";

import { useEffect, useState } from "react";

type Flags = {
  pause_all: boolean;
  pause_reserve: boolean;
  pause_stats_ingest: boolean;
  updated_at?: string;
  updated_by?: string | null;
};

export default function MasterAdminPage() {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [flags, setFlags] = useState<Flags | null>(null);
  const [msg, setMsg] = useState<string>("");

  const [byMinute, setByMinute] = useState<any[]>([]);
  const [topInstalls, setTopInstalls] = useState<any[]>([]);

  async function login() {
    setMsg("");
    const r = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (!r.ok) return setMsg("Invalid PIN.");
    setAuthed(true);
    setPin("");
    await refresh();
  }

  async function refresh() {
    const r = await fetch("/api/admin/flags", { cache: "no-store" });
    if (!r.ok) return setMsg("Not authed.");
    const j = await r.json();
    setFlags(j.flags);

    const m = await fetch("/api/admin/metrics", { cache: "no-store" });
    if (m.ok) {
      const mj = await m.json();
      setByMinute(mj.byMinute ?? []);
      setTopInstalls(mj.topInstalls ?? []);
    }
  }

  async function save(next: Flags) {
    setMsg("");
    const r = await fetch("/api/admin/flags", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!r.ok) return setMsg("Save failed.");
    await refresh();
    setMsg("Saved.");
  }

  useEffect(() => {
    refresh().catch(() => {});
    const t = setInterval(() => refresh().catch(() => {}), 5000);
    return () => clearInterval(t);
  }, []);

  const pill = (on: boolean, label: string) => (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        border: "1px solid #333",
        background: on ? "#221" : "#111",
        color: on ? "#ffd36a" : "#9aa0a6",
        fontSize: 12,
        marginLeft: 8,
      }}
    >
      {on ? "ON" : "OFF"} · {label}
    </span>
  );

  return (
    <div style={{ padding: 20, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
      <h1>Master Admin</h1>
      <p style={{ opacity: 0.8 }}>Emergency controls + live diagnostics.</p>

      {!authed && (
        <div style={{ marginTop: 16 }}>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            type="password"
            style={{ padding: 10, width: 240 }}
          />
          <button onClick={login} style={{ marginLeft: 10, padding: 10 }}>
            Unlock
          </button>
          {msg && <div style={{ marginTop: 10 }}>{msg}</div>}
        </div>
      )}

      {authed && flags && (
        <div style={{ marginTop: 20 }}>
          {/* Operator Guide */}
          <div
            style={{
              border: "1px solid #333",
              borderRadius: 10,
              padding: 14,
              background: "#0b0b0b",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Operator Guide</div>

            <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.92 }}>
              <div style={{ marginBottom: 10 }}>
                <b>Rule #1:</b> Toggles do nothing until you press <b>Save</b>.
                <br />
                <b>Rule #2:</b> If you’re unsure, use <b>Panic: Pause Everything</b> first, then diagnose.
              </div>

              <div style={{ marginBottom: 10 }}>
                <b>What each switch does:</b>
                <ul style={{ margin: "8px 0 0 18px" }}>
                  <li>
                    <b>PAUSE_ALL</b> — Stops core protocol actions everywhere. Use when something is clearly wrong and you need a full stop.
                    {pill(flags.pause_all, "Full stop")}
                    <br />
                    <span style={{ opacity: 0.85 }}>
                      Safe: Yes (best first move). Risk: users can’t perform actions while ON.
                    </span>
                  </li>
                  <li style={{ marginTop: 8 }}>
                    <b>PAUSE_RESERVE</b> — Stops <b>reserve/spend writes</b> (prevents USDDD consumption & box draining). Use if “USDDD Utilized” spikes,
                    or you suspect automated digging/reserving.
                    {pill(flags.pause_reserve, "Stops reserves")}
                    <br />
                    <span style={{ opacity: 0.85 }}>
                      Safe: Yes. Risk: legitimate digs won’t reserve rewards while ON.
                    </span>
                  </li>
                  <li style={{ marginTop: 8 }}>
                    <b>PAUSE_STATS_INGEST</b> — Stops <b>stats_events</b> writes (prevents metric spam / Scan inflation). Use if Scan numbers climb unnaturally
                    but you want to keep reserves live.
                    {pill(flags.pause_stats_ingest, "Stops stats")}
                    <br />
                    <span style={{ opacity: 0.85 }}>
                      Safe: Yes. Risk: dashboards/scan analytics may go quiet while ON.
                    </span>
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: 10 }}>
                <b>Quick decision flow:</b>
                <ol style={{ margin: "8px 0 0 18px" }}>
                  <li>
                    <b>Everything looks wrong / you’re under attack:</b> Click <b>Panic: Pause Everything</b> → <b>Save</b>.
                  </li>
                  <li style={{ marginTop: 6 }}>
                    <b>Scan “USDDD Utilized (24h)” climbing fast:</b> Turn ON <b>PAUSE_RESERVE</b> → <b>Save</b>.
                  </li>
                  <li style={{ marginTop: 6 }}>
                    <b>Only Scan/metrics are being spammed:</b> Turn ON <b>PAUSE_STATS_INGEST</b> → <b>Save</b>.
                  </li>
                  <li style={{ marginTop: 6 }}>
                    <b>Recover safely:</b> Turn OFF <b>PAUSE_ALL</b> first (if it was on), then OFF the specific pause you used → <b>Save</b>.
                  </li>
                </ol>
              </div>

              <div style={{ opacity: 0.85 }}>
                <b>Tip:</b> Use the sections below to verify the situation is calming down:
                <br />
                - “Stats Events (last 10 minutes)” should drop toward zero when PAUSE_STATS_INGEST is ON.
                <br />
                - “Top installs (dig_success)” shows the worst offenders (useful for later banning/rate limiting).
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <label>
              <input
                type="checkbox"
                checked={flags.pause_all}
                onChange={(e) => setFlags({ ...flags, pause_all: e.target.checked })}
              />{" "}
              PAUSE_ALL
            </label>

            <label>
              <input
                type="checkbox"
                checked={flags.pause_reserve}
                onChange={(e) => setFlags({ ...flags, pause_reserve: e.target.checked })}
              />{" "}
              PAUSE_RESERVE
            </label>

            <label>
              <input
                type="checkbox"
                checked={flags.pause_stats_ingest}
                onChange={(e) => setFlags({ ...flags, pause_stats_ingest: e.target.checked })}
              />{" "}
              PAUSE_STATS_INGEST
            </label>

            <button onClick={() => save(flags)} style={{ padding: "8px 12px" }}>
              Save
            </button>

            <button
              onClick={() => save({ pause_all: true, pause_reserve: true, pause_stats_ingest: true })}
              style={{ padding: "8px 12px" }}
            >
              Panic: Pause Everything
            </button>

            <button
              onClick={() => save({ pause_all: false, pause_reserve: false, pause_stats_ingest: false })}
              style={{ padding: "8px 12px" }}
            >
              Resume Everything
            </button>
          </div>

          <div style={{ marginTop: 12, opacity: 0.8 }}>
            Last update: {flags.updated_at} {flags.updated_by ? `by ${flags.updated_by}` : ""}
          </div>

          {msg && <div style={{ marginTop: 10 }}>{msg}</div>}

          <hr style={{ margin: "20px 0" }} />

          <h2>Stats Events (last 10 minutes)</h2>
          <pre style={{ background: "#111", color: "#0f0", padding: 12, overflow: "auto" }}>
{JSON.stringify(byMinute, null, 2)}
          </pre>

          <h2>Top installs (dig_success)</h2>
          <pre style={{ background: "#111", color: "#0f0", padding: 12, overflow: "auto" }}>
{JSON.stringify(topInstalls, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
