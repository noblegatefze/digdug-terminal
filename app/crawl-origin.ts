const canonicalHosts: Record<string, string> = {
  "www.digdug.do": "https://www.digdug.do",
  "digdug.do": "https://www.digdug.do",
  "feed.digdug.do": "https://feed.digdug.do",
  "old.digdug.do": "https://old.digdug.do"
};

export function sitemapOrigin(request: Request) {
  const host = new URL(request.url).hostname;
  return Object.hasOwn(canonicalHosts, host) ? canonicalHosts[host] : "https://www.digdug.do";
}
