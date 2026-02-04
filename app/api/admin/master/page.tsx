"use client";

import React, { useEffect, useMemo, useState } from "react";

type TabKey = "overview" | "flags" | "integrity" | "user" | "boxes" | "fund";

async function fetchJson(path: string, init?: RequestInit) {
  const r = await fetch(path, {
    cache: "no-store",
    ...(init ?? {}),
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await r.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { ok: r.ok, status: r.status, json };
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        padding: 14,
        background: "rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function CodeBlock({ value }: { value: any }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: 12,
        borderRadius: 10,
        background: "rgba(0,0,0,0.55)",
        border: "1px solid rgba(255,255,255,0.10)",
        fontSize: 12,
        lineHeight: 1.35,
        overflow: "auto",
        maxHeight: 360,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function AdminMasterPage() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  const [pin, setPin] = useState("");
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  const [tab, setTab] = useState<TabKey>("overview");

  // quick tools state
  const [buildInfo, setBuildInfo] = useState<any>(null);
  const [flagsInfo, setFlagsInfo] = useState<any>(null);
  const [integrityInfo, setIntegrityInfo] = useState<any>(null);
  const [userQuery, setUserQuery] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);

  const tabs = useMemo(
    () => [
      { key: "overview" as const, label: "Overview" },
      { key: "flags" as const, label: "Flags" },
      { key: "integrity" as const, label: "Integrity" },
      { key: "user" as const, label: "User" },
      { key: "boxes" as const, label: "Boxes" },
      { key: "fund" as const, label: "Fund" },
    ],
    []
  );

  async function checkAuth() {
    const res = await fetchJson("/api/admin/auth/me");
    setAuthed(Boolean(res.ok && res.json?.ok));
    setReady(true);
  }

  useEffect(() => {
    checkAuth();
  }, []);

  async function login() {
    setLoginErr(null);
    setLoginBusy(true);
    try {
      // Your existing route is app/api/admin/auth/route.ts
      const res = await fetchJson("/api/admin/auth", {
        method: "POST",
        body: JSON.stringify({ pin }),
      });

      if (!res.ok || !res.json?.ok) {
        setLoginErr(res.json?.error ?? `login_failed_${res.status}`);
        return;
      }

      setPin("");
      await checkAuth();
    } finally {
      setLoginBusy(false);
    }
  }

  async function refreshBuild() {
    // meta build exists in your project
    const res = await fetchJson("/api/meta/build");
    setBuildInfo(res.json);
  }

  async function refreshFlags() {
    // if you already have /api/admin/flags, this will populate; otherwise it'll show the error cleanly
    const res = await fetchJson("/api/admin/flags");
    setFlagsInfo(res.json);
  }

  async function refreshIntegrity() {
    // Placeholder endpoint we’ll add next (one step later).
    // For now you’ll see 404 until we create it.
    const res = await fetchJson("/api/admin/metrics/integrity");
    setIntegrityInfo(res.json);
  }

  async function lookupUser() {
    // Placeholder endpoint we’ll add next.
    // For now you’ll see 404 until we create it.
    const res = await fetchJson(`/api/admin/metrics/user?username=${encodeURIComponent(userQuery)}`);
    setUserInfo(res.json);
  }

  if (!ready) {
    return (
      <div style={{ padding: 24, color: "#d6d6d6", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
        Loading…
      </div>
    );
  }

  if (!authed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: 24,
          color: "#d6d6d6",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          background:
            "radial-gradient(1200px 800px at 20% 0%, rgba(255,166,0,0.10), transparent), radial-gradient(900px 700px at 80% 20%, rgba(0,170,255,0.10), transparent), #07090d",
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <div style={{ fontSize: 14, opacity: 0.85 }}>DIGDUG.DO</div>
          <h1 style={{ margin: "10px 0 14px", fontSize: 22 }}>
            Operator Console
          </h1>

          <Card title="Enter Admin PIN">
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="ADMIN PIN"
                type="password"
                inputMode="numeric"
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.45)",
                  color: "#fff",
                  outline: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") login();
                }}
              />
              <button
                onClick={login}
                disabled={loginBusy || !pin}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: loginBusy ? "rgba(255,255,255,0.08)" : "rgba(255,166,0,0.16)",
                  color: "#fff",
                  cursor: loginBusy ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {loginBusy ? "Checking…" : "Unlock"}
              </button>
            </div>

            {loginErr ? (
              <div style={{ marginTop: 10, color: "#ff6b6b", fontSize: 12 }}>
                {String(loginErr)}
              </div>
            ) : (
              <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12 }}>
                PIN is verified server-side. Cookie is httpOnly.
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        color: "#d6d6d6",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        background:
          "radial-gradient(1200px 800px at 20% 0%, rgba(255,166,0,0.10), transparent), radial-gradient(900px 700px at 80% 20%, rgba(0,170,255,0.10), transparent), #07090d",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <div style={{ fontSize: 14, opacity: 0.85 }}>DIGDUG.DO</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Operator Console</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button
            onClick={refreshBuild}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.35)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Refresh Build
          </button>
          <button
            onClick={refreshFlags}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.35)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Refresh Flags
          </button>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              background:
                tab === t.key ? "rgba(255,166,0,0.18)" : "rgba(0,0,0,0.35)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        {tab === "overview" && (
          <>
            <Card title="Build / Version">
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <button
                  onClick={refreshBuild}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.35)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Load
                </button>
              </div>
              <CodeBlock value={buildInfo ?? { note: "Click Load. Source: /api/meta/build" }} />
            </Card>

            <Card title="Admin Flags (pause switches)">
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <button
                  onClick={refreshFlags}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.35)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Load
                </button>
              </div>
              <CodeBlock value={flagsInfo ?? { note: "Click Load. If 404, your flags route is elsewhere — we’ll wire it." }} />
            </Card>

            <Card title="Next (we’ll add)">
              <CodeBlock
                value={{
                  todo: [
                    "Protocol money snapshot (24h): spent / claims USD / efficiency",
                    "Fund totals: total funded, active/awaiting",
                    "Integrity: reserves_without_claim (last 24h), claims_without_reserve (last 24h)",
                    "User lookup: balances + last 50 spends + last 50 claims",
                  ],
                }}
              />
            </Card>
          </>
        )}

        {tab === "flags" && (
          <Card title="Flags">
            <div style={{ marginBottom: 10, opacity: 0.75, fontSize: 12 }}>
              This tab will eventually provide toggle UI. For now it shows raw payload.
            </div>
            <CodeBlock value={flagsInfo ?? { hint: "Click Refresh Flags (top-right), or we wire the correct endpoint next." }} />
          </Card>
        )}

        {tab === "integrity" && (
          <Card title="Integrity">
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <button
                onClick={refreshIntegrity}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.35)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Load
              </button>
            </div>
            <CodeBlock
              value={
                integrityInfo ?? {
                  note:
                    "Next step: create /api/admin/metrics/integrity (SQL-backed). Until then you may see 404 here.",
                }
              }
            />
          </Card>
        )}

        {tab === "user" && (
          <Card title="User Lookup">
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="username (e.g. toastpunk2)"
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.45)",
                  color: "#fff",
                  outline: "none",
                  fontSize: 12,
                }}
              />
              <button
                onClick={lookupUser}
                disabled={!userQuery}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.35)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Lookup
              </button>
            </div>
            <CodeBlock
              value={
                userInfo ?? {
                  note:
                    "Next step: create /api/admin/metrics/user?username=... returning user_state, last spends, last claims.",
                }
              }
            />
          </Card>
        )}

        {tab === "boxes" && (
          <Card title="Boxes">
            <CodeBlock
              value={{
                note:
                  "Next step: box accounting view (fund_in / reserved / claimed / withdrawn) + mismatches by box.",
              }}
            />
          </Card>
        )}

        {tab === "fund" && (
          <Card title="Fund Network">
            <CodeBlock
              value={{
                note:
                  "Next step: fund backing (global + per-user) and position drilldown (sweeps, mint, transfer, burn).",
              }}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
