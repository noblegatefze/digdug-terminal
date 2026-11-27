import type { Metadata } from "next";
import Script from "next/script";
import LegacyTerminal from "../LegacyTerminal";

export const metadata: Metadata = {
  "title": "Legacy Terminal | DIGDUG.DO",
  "description": "Visit the original DIGDUG.DO Terminal and follow the transition from the legacy experience to Flatverse.",
  "alternates": {
    "canonical": "https://old.digdug.do/"
  },
  "openGraph": {
    "title": "Legacy Terminal | DIGDUG.DO",
    "description": "Visit the original DIGDUG.DO Terminal and follow the transition from the legacy experience to Flatverse.",
    "url": "https://old.digdug.do/",
    "siteName": "DIGDUG.DO",
    "type": "website",
    "images": [
      {
        "url": "https://www.digdug.do/toastpunk-terminal-prison.png",
        "alt": "ToastPunk’s last Terminal transmission"
      }
    ]
  },
  "twitter": {
    "card": "summary_large_image",
    "title": "Legacy Terminal | DIGDUG.DO",
    "description": "Visit the original DIGDUG.DO Terminal and follow the transition from the legacy experience to Flatverse.",
    "images": [
      {
        "url": "https://www.digdug.do/toastpunk-terminal-prison.png",
        "alt": "ToastPunk’s last Terminal transmission"
      }
    ]
  }
};

export default function LegacyTerminalPage() {
  return <>
    <LegacyTerminal />
    <div style={{ position: "fixed", top: 12, right: 12, zIndex: 100 }} data-explorer-account="" />
    <Script src="https://usddd.digdug.do/explorer-account.js" strategy="afterInteractive" />
  </>;
}
