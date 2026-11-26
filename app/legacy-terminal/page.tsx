import Script from "next/script";
import LegacyTerminal from "../LegacyTerminal";

export const metadata = { title: "Legacy Terminal | DIGDUG.DO" };

export default function LegacyTerminalPage() {
  return <>
    <LegacyTerminal />
    <div style={{ position: "fixed", top: 12, right: 12, zIndex: 100 }} data-explorer-account="" />
    <Script src="https://usddd.digdug.do/explorer-account.js" strategy="afterInteractive" />
  </>;
}
