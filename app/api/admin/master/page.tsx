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
  const [integrityErr, setIntegrityErr] = useState<string | null>(null);
  const [integrityLoading, setIntegrityLoading] = useState(false);
  const [userErr, setUserErr] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [boxesErr, setBoxesErr] = useState<string | null>(null);
  const [boxesLoading, setBoxesLoading] = useState(false);
  const [boxesHours, setBoxesHours] = useState(24);
  const [boxesInfo, setBoxesInfo] = useState<any>(null);
  const [fundErr, setFundErr] = useState<string | null>(null);
  const [fundLoading, setFundLoading] = useState(false);
  const [fundLimit, setFundLimit] = useState(50);
  const [fundInfo, setFundInfo] = useState<any>(null);

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
    setIntegrityErr(null);
    setIntegrityLoading(true);
    try {
      const res = await fetchJson("/api/admin/metrics/integrity");
      if (!res.ok) {
        setIntegrityErr(res.json?.error ?? `integrity_failed_${res.status}`);
        setIntegrityInfo(res.json);
        return;
      }
      setIntegrityInfo(res.json);
    } finally {
      setIntegrityLoading(false);
    }
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

  async function refreshBoxes() {
    setBoxesErr(null);
    setBoxesLoading(true);
    try {
      const hrs = Math.max(1, Math.min(168, Number(boxesHours) || 24));
      const res = await fetchJson(`/api/admin/metrics/boxes?sinceHours=${encodeURIComponent(String(hrs))}`);
      if (!res.ok || !res.json?.ok) {
        setBoxesErr(res.json?.error ?? `boxes_failed_${res.status}`);
        setBoxesInfo(res.json);
        return;
      }
      setBoxesInfo(res.json);
    } finally {
      setBoxesLoading(false);
    }
  }

  async function refreshFund() {
    setFundErr(null);
    setFundLoading(true);
    try {
      const lim = Math.max(10, Math.min(200, Number(fundLimit) || 50));
      const res = await fetchJson(`/api/admin/metrics/fund?limit=${encodeURIComponent(String(lim))}`);
      if (!res.ok || !res.json?.ok) {
        setFundErr(res.json?.error ?? `fund_failed_${res.status}`);
        setFundInfo(res.json);
        return;
      }
      setFundInfo(res.json);
    } finally {
      setFundLoading(false);
    }
  }

  async function lookupUser() {
    setUserErr(null);
    setUserLoading(true);
    try {
      const res = await fetchJson(`/api/admin/metrics/user?username=${encodeURIComponent(userQuery)}`);
      if (!res.ok || !res.json?.ok) {
        setUserErr(res.json?.error ?? `user_lookup_failed_${res.status}`);
        setUserInfo(res.json);
        return;
      }
      setUserInfo(res.json);
    } finally {
      setUserLoading(false);
    }
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
          <Card title="Integrity (24h)">
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <button
                onClick={refreshIntegrity}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: integrityLoading ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.35)",
                  color: "#fff",
                  cursor: integrityLoading ? "not-allowed" : "pointer",
                  fontSize: 12,
                }}
                disabled={integrityLoading}
              >
                {integrityLoading ? "Loading…" : "Load"}
              </button>
            </div>

            {integrityErr ? (
              <div style={{ marginBottom: 10, color: "#ff6b6b", fontSize: 12 }}>
                {integrityErr}
              </div>
            ) : null}

            {(() => {
              const o = integrityInfo ?? null;

              // API returns: { ok, window: { since }, reserves_without_claim, claims_without_reserve, amount_mismatch, top_boxes... }
              const since = o?.window?.since ?? null;

              const rCnt = Number(o?.reserves_without_claim?.count ?? 0);
              const rAmt = Number(o?.reserves_without_claim?.amount ?? 0);

              const cCnt = Number(o?.claims_without_reserve?.count ?? 0);
              const cAmt = Number(o?.claims_without_reserve?.amount ?? 0);

              const mCnt = Number(o?.amount_mismatch?.count ?? 0);

              const top = Array.isArray(o?.top_boxes_reserves_without_claim)
                ? o.top_boxes_reserves_without_claim
                : [];

              const fmtInt = (n: number) => (Number.isFinite(n) ? n.toLocaleString() : "—");
              const fmtMoney = (n: number) =>
                Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 6 }) : "—";

              const okColor =
                rCnt === 0 && cCnt === 0 && mCnt === 0 ? "rgba(0,255,170,0.10)" : "rgba(255,166,0,0.10)";

              return (
                <>
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 12,
                      padding: 12,
                      background: okColor,
                      marginBottom: 10,
                      fontSize: 12,
                      opacity: 0.9,
                    }}
                  >
                    Status:{" "}
                    <b>
                      {rCnt === 0 && cCnt === 0 && mCnt === 0 ? "CLEAN" : "ATTENTION"}
                    </b>
                    <span style={{ opacity: 0.7 }}> — Window since: {since ? String(since) : "—"}</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.35)" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>Reserves without Claim</div>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{fmtInt(rCnt)}</div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Amount: {fmtMoney(rAmt)}</div>
                    </div>

                    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.35)" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>Claims without Reserve</div>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{fmtInt(cCnt)}</div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Amount: {fmtMoney(cAmt)}</div>
                    </div>

                    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.35)" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>Amount Mismatches</div>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{fmtInt(mCnt)}</div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                        Expected: 0 (dig_id-linked)
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
                      Top boxes (reserves without claim)
                    </div>

                    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 180px", gap: 0, padding: "10px 12px", background: "rgba(0,0,0,0.40)", fontSize: 12, opacity: 0.8 }}>
                        <div>Box</div>
                        <div>Count</div>
                        <div>Amount</div>
                      </div>

                      {(top.length ? top : []).slice(0, 10).map((row: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 120px 180px",
                            padding: "10px 12px",
                            borderTop: "1px solid rgba(255,255,255,0.08)",
                            fontSize: 12,
                          }}
                        >
                          <div>{String(row.box_id ?? "—")}</div>
                          <div>{fmtInt(Number(row.cnt ?? 0))}</div>
                          <div>{fmtMoney(Number(row.amount_sum ?? 0))}</div>
                        </div>
                      ))}

                      {!top.length ? (
                        <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 12, opacity: 0.7 }}>
                          No offenders found (good).
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") lookupUser();
                }}
              />
              <button
                onClick={lookupUser}
                disabled={!userQuery || userLoading}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: userLoading ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.35)",
                  color: "#fff",
                  cursor: userLoading ? "not-allowed" : "pointer",
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}
              >
                {userLoading ? "Loading…" : "Lookup"}
              </button>
            </div>

            {userErr ? (
              <div style={{ marginBottom: 10, color: "#ff6b6b", fontSize: 12 }}>
                {userErr}
              </div>
            ) : null}

            {(() => {
              const o = userInfo ?? null;
              const user = o?.user ?? null;
              const state = o?.state ?? null;
              const spends = Array.isArray(o?.spends) ? o.spends : [];
              const claims = Array.isArray(o?.claims) ? o.claims : [];

              const fmtInt = (n: any) =>
                Number.isFinite(Number(n)) ? Number(n).toLocaleString() : "—";
              const fmtMoney = (n: any) =>
                Number.isFinite(Number(n))
                  ? Number(n).toLocaleString(undefined, { maximumFractionDigits: 6 })
                  : "—";

              const header = user
                ? `${user.username}  •  ${String(user.id).slice(0, 8)}…`
                : "No user loaded";

              return (
                <>
                  <div style={{ marginBottom: 10, fontSize: 12, opacity: 0.85 }}>
                    <b>{header}</b>
                    {user?.created_at ? (
                      <span style={{ opacity: 0.7 }}>
                        {" "}
                        — created {String(user.created_at)}
                      </span>
                    ) : null}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.35)" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>USDDD Allocated</div>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{fmtMoney(state?.usddd_allocated)}</div>
                    </div>

                    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.35)" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>USDDD Acquired</div>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{fmtMoney(state?.usddd_acquired)}</div>
                    </div>

                    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.35)" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>Digs / Finds</div>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>
                        {fmtInt(state?.digs_count)} / {fmtInt(state?.finds_count)}
                      </div>
                    </div>

                    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.35)" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>Last Updated</div>
                      <div style={{ fontSize: 12, marginTop: 8, opacity: 0.85 }}>
                        {state?.updated_at ? String(state.updated_at) : "—"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
                        Last 50 USDDD spends
                      </div>

                      <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, overflow: "hidden" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "140px 120px 1fr 120px", padding: "10px 12px", background: "rgba(0,0,0,0.40)", fontSize: 12, opacity: 0.8 }}>
                          <div>Time</div>
                          <div>Type</div>
                          <div>Box</div>
                          <div>USDDD</div>
                        </div>

                        {spends.slice(0, 50).map((r: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "140px 120px 1fr 120px",
                              padding: "10px 12px",
                              borderTop: "1px solid rgba(255,255,255,0.08)",
                              fontSize: 12,
                            }}
                          >
                            <div style={{ opacity: 0.85 }}>{String(r.created_at ?? "").slice(0, 16)}</div>
                            <div>{String(r.spend_type ?? "—")}</div>
                            <div style={{ opacity: 0.85 }}>{String(r.box_id ?? "—")}</div>
                            <div>{fmtMoney(r.usddd_amount)}</div>
                          </div>
                        ))}

                        {!spends.length ? (
                          <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 12, opacity: 0.7 }}>
                            No spend rows found.
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
                        Last 50 treasure claims
                      </div>

                      <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, overflow: "hidden" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "140px 90px 90px 1fr 120px", padding: "10px 12px", background: "rgba(0,0,0,0.40)", fontSize: 12, opacity: 0.8 }}>
                          <div>Time</div>
                          <div>Chain</div>
                          <div>Token</div>
                          <div>Box</div>
                          <div>Amount</div>
                        </div>

                        {claims.slice(0, 50).map((r: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "140px 90px 90px 1fr 120px",
                              padding: "10px 12px",
                              borderTop: "1px solid rgba(255,255,255,0.08)",
                              fontSize: 12,
                            }}
                          >
                            <div style={{ opacity: 0.85 }}>{String(r.created_at ?? "").slice(0, 16)}</div>
                            <div>{String(r.chain_id ?? "—")}</div>
                            <div>{String(r.token_symbol ?? "—")}</div>
                            <div style={{ opacity: 0.85 }}>{String(r.box_id ?? "—")}</div>
                            <div>{fmtMoney(r.amount)}</div>
                          </div>
                        ))}

                        {!claims.length ? (
                          <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 12, opacity: 0.7 }}>
                            No claim rows found.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
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

        {tab === "boxes" && (
          <Card title="Boxes (Accounting)">
            <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              <input
                value={String(boxesHours)}
                onChange={(e) => setBoxesHours(Number(e.target.value))}
                placeholder="sinceHours (1–168)"
                inputMode="numeric"
                style={{
                  width: 180,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.45)",
                  color: "#fff",
                  outline: "none",
                  fontSize: 12,
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") refreshBoxes();
                }}
              />

              <button
                onClick={refreshBoxes}
                disabled={boxesLoading}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: boxesLoading ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.35)",
                  color: "#fff",
                  cursor: boxesLoading ? "not-allowed" : "pointer",
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}
              >
                {boxesLoading ? "Loading…" : "Load"}
              </button>

              <div style={{ fontSize: 12, opacity: 0.7, alignSelf: "center" }}>
                Shows top mismatches by |claimed − reserved| within the time window.
              </div>
            </div>

            {boxesErr ? (
              <div style={{ marginBottom: 10, color: "#ff6b6b", fontSize: 12 }}>
                {boxesErr}
              </div>
            ) : null}

            {(() => {
              const o = boxesInfo ?? null;
              const top = Array.isArray(o?.top_mismatches) ? o.top_mismatches : [];
              const sinceHours = o?.window?.sinceHours ?? null;
              const since = o?.window?.since ?? null;

              const fmtMoney = (n: any) =>
                Number.isFinite(Number(n))
                  ? Number(n).toLocaleString(undefined, { maximumFractionDigits: 6 })
                  : "—";

              const fmtBox = (s: any) => String(s ?? "—");

              return (
                <>
                  <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 10 }}>
                    Window: last <b>{sinceHours ?? boxesHours}</b> hours{" "}
                    <span style={{ opacity: 0.7 }}> (since {since ? String(since) : "—"})</span>
                  </div>

                  <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, overflow: "hidden" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "120px 1fr 1fr 1fr 1fr",
                        padding: "10px 12px",
                        background: "rgba(0,0,0,0.40)",
                        fontSize: 12,
                        opacity: 0.8,
                      }}
                    >
                      <div>Box</div>
                      <div>Fund In</div>
                      <div>Reserved</div>
                      <div>Claimed</div>
                      <div>Claimed − Reserved</div>
                    </div>

                    {top.slice(0, 20).map((r: any, idx: number) => {
                      const delta = Number(r.claimed_minus_reserved ?? 0);
                      const deltaBg =
                        Math.abs(delta) < 0.000001
                          ? "transparent"
                          : delta > 0
                            ? "rgba(0,255,170,0.06)"
                            : "rgba(255,80,80,0.06)";

                      return (
                        <div
                          key={idx}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "120px 1fr 1fr 1fr 1fr",
                            padding: "10px 12px",
                            borderTop: "1px solid rgba(255,255,255,0.08)",
                            fontSize: 12,
                            background: deltaBg,
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>{fmtBox(r.box_id)}</div>
                          <div>{fmtMoney(r.fund_in)}</div>
                          <div>{fmtMoney(r.reserved)}</div>
                          <div>{fmtMoney(r.claimed)}</div>
                          <div style={{ fontWeight: 700 }}>{fmtMoney(r.claimed_minus_reserved)}</div>
                        </div>
                      );
                    })}

                    {!top.length ? (
                      <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 12, opacity: 0.7 }}>
                        No data loaded yet. Set sinceHours and click Load.
                      </div>
                    ) : null}
                  </div>

                  <div style={{ marginTop: 10 }}>
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

        {tab === "fund" && (
          <Card title="Fund Network">
            <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              <input
                value={String(fundLimit)}
                onChange={(e) => setFundLimit(Number(e.target.value))}
                placeholder="latest limit (10–200)"
                inputMode="numeric"
                style={{
                  width: 200,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.45)",
                  color: "#fff",
                  outline: "none",
                  fontSize: 12,
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") refreshFund();
                }}
              />

              <button
                onClick={refreshFund}
                disabled={fundLoading}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: fundLoading ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.35)",
                  color: "#fff",
                  cursor: fundLoading ? "not-allowed" : "pointer",
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}
              >
                {fundLoading ? "Loading…" : "Load"}
              </button>

              <div style={{ fontSize: 12, opacity: 0.7, alignSelf: "center" }}>
                Totals are computed over all positions; table shows latest N.
              </div>
            </div>

            {fundErr ? (
              <div style={{ marginBottom: 10, color: "#ff6b6b", fontSize: 12 }}>
                {fundErr}
              </div>
            ) : null}

            {(() => {
              const o = fundInfo ?? null;
              const t = o?.totals ?? null;
              const latest = Array.isArray(o?.latest) ? o.latest : [];

              const fmtInt = (n: any) => (Number.isFinite(Number(n)) ? Number(n).toLocaleString() : "—");
              const fmtMoney = (n: any) =>
                Number.isFinite(Number(n)) ? Number(n).toLocaleString(undefined, { maximumFractionDigits: 6 }) : "—";

              return (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10, marginBottom: 12 }}>
                    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.35)" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>Total Funded (USDT)</div>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{fmtMoney(t?.total_usdt)}</div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                        Positions: {fmtInt(t?.positions)} (active {fmtInt(t?.active_positions)}, awaiting {fmtInt(t?.awaiting_positions)})
                      </div>
                    </div>

                    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.35)" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>USDDD Allocated</div>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{fmtMoney(t?.total_usddd_allocated)}</div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Custodied/locked allocations</div>
                    </div>

                    <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.35)" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>USDDD Accrued (display)</div>
                      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{fmtMoney(t?.total_usddd_accrued_display)}</div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Display accrual (not minted)</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>Latest positions</div>

                  <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, overflow: "hidden" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "140px 120px 120px 120px 1fr",
                        padding: "10px 12px",
                        background: "rgba(0,0,0,0.40)",
                        fontSize: 12,
                        opacity: 0.8,
                      }}
                    >
                      <div>Ref</div>
                      <div>Status</div>
                      <div>USDT</div>
                      <div>USDDD</div>
                      <div>Created</div>
                    </div>

                    {latest.slice(0, Number(fundLimit) || 50).map((r: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "140px 120px 120px 120px 1fr",
                          padding: "10px 12px",
                          borderTop: "1px solid rgba(255,255,255,0.08)",
                          fontSize: 12,
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>{String(r.position_ref ?? "—").slice(0, 14)}</div>
                        <div>{String(r.status ?? "—")}</div>
                        <div>{fmtMoney(r.funded_usdt)}</div>
                        <div>{fmtMoney(r.usddd_allocated)}</div>
                        <div style={{ opacity: 0.85 }}>{String(r.created_at ?? "").slice(0, 19)}</div>
                      </div>
                    ))}

                    {!latest.length ? (
                      <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 12, opacity: 0.7 }}>
                        No data loaded yet. Set limit and click Load.
                      </div>
                    ) : null}
                  </div>

                  <div style={{ marginTop: 10 }}>
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

      </div>
    </div>
  );
}
