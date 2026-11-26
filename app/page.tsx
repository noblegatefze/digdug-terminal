import { headers } from "next/headers";
import Home, { metadata as homeMetadata } from "./flatverse/page";
import Dispatch, { metadata as dispatchMetadata } from "./surface-dispatch/page";
import LegacyTerminal, { metadata as legacyMetadata } from "./legacy-terminal/page";

export async function generateMetadata() {
  const host = (await headers()).get("host")?.split(":")[0];
  if (host === "feed.digdug.do") return dispatchMetadata;
  if (host === "old.digdug.do") return legacyMetadata;
  return homeMetadata;
}

export default async function Page(props: Parameters<typeof Dispatch>[0]) {
  const host = (await headers()).get("host")?.split(":")[0];
  if (host === "feed.digdug.do") return <Dispatch {...props} />;
  if (host === "old.digdug.do") return <LegacyTerminal />;
  return <Home />;
}
