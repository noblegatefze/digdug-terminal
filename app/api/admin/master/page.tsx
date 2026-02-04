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
  const [overviewInfo, setOverviewInfo] = useState<any>(null);
  const [overviewErr, setOverviewErr] = useState<string | null>(null);

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
    if (Boolean(res.ok && res.json?.ok)) {
      // load overview immediately once authed
      refreshOverview().catch(() => { });
    }
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

  async function refreshOverview() {
    setOverviewErr(null);
    const res = await fetchJson("/api/admin/metrics/overview");
    if (!res.ok) {
      setOverviewErr(res.json?.error ?? `overview_failed_${res.status}`);
      setOverviewInfo(res.json);
      return;
    }
    setOverviewInfo(res.json);
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
            <Card title="Protocol Snapshot (24h)">
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <button
                  onClick={refreshOverview}
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
                  Refresh Overview
                </button>
              </div>

              {overviewErr ? (
                <div style={{ marginBottom: 10, color: "#ff6b6b", fontSize: 12 }}>
                  {overviewErr}
                </div>
              ) : null}

              <CodeBlock
                value={
                  overviewInfo ?? {
                    note: "Loading…",
                    hint: "Click Refresh Overview if it doesn’t auto-load.",
                  }
                }
              />
            </Card>

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
          </>
        )}

        {tab === "flags" && (
          <Card title="Flags">
            <div style={{ marginBottom: 10, opacity: 0.75, fontSize: 12 }}>
              This tab will eventually provide toggle UI. For now it shows raw payload.
            </div>
            {(() => {
              const o = overviewInfo ?? null;

              const since = o?.window?.since ?? null;

              const protocolEvents = Number(o?.counts?.protocol_events_24h ?? 0);
              const sessions = Number(o?.counts?.sessions_24h ?? 0);
              const claims = Number(o?.counts?.claims_24h ?? 0);

              const usdddSpent = Number(o?.money?.usddd_spent_24h ?? 0);
              const fundTotal = Number(o?.money?.fund_total_usdt ?? 0);

              const activePos = Number(o?.fund?.active_positions ?? 0);
              const awaitingPos = Number(o?.fund?.awaiting_positions ?? 0);

              const fmtInt = (n: number) => (Number.isFinite(n) ? n.toLocaleString() : "—");
              const fmtMoney = (n: number) =>
                Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 6 }) : "—";

              return (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.35)" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>Protocol Actions (24h)</div>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{fmtInt(protocolEvents)}</div>
                    </div>

                    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.35)" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>Sessions (24h)</div>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{fmtInt(sessions)}</div>
                    </div>

                    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.35)" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>Claims (24h)</div>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{fmtInt(claims)}</div>
                    </div>

                    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.35)" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>USDDD Spent (24h)</div>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{fmtMoney(usdddSpent)}</div>
                    </div>

                    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.35)" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>Fund Total (USDT)</div>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{fmtMoney(fundTotal)}</div>
                    </div>

                    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.35)" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>Fund Positions</div>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>
                        {fmtInt(activePos)} <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 600 }}>active</span>
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                        {fmtInt(awaitingPos)} awaiting
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                    <div style={{ fontSize: 12, opacity: 0.65 }}>
                      Window since: {since ? String(since) : "—"}
                    </div>

                    <details style={{ fontSize: 12, opacity: 0.9 }}>
                      <summary style={{ cursor: "pointer" }}>View raw</summary>
                      <div style={{ marginTop: 8 }}>
                        <CodeBlock value={o ?? { note: "No data loaded yet." }} />
                      </div>
                    </details>
                  </div>
                </>
              );
            })()}
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
