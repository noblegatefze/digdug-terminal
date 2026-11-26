import type { NextConfig } from "next";

const publicHost = (name: string) => ({ type: "host" as const, value: name });

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/surface-dispatch", has: [publicHost("(?:www\\.|feed\\.)?digdug\\.do")], destination: "https://feed.digdug.do/", permanent: false },
      { source: "/legacy-terminal", has: [publicHost("(?:www\\.|old\\.)?digdug\\.do")], destination: "https://old.digdug.do/", permanent: false },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", has: [{ type: "host", value: "feed\\.digdug\\.do" }], destination: "/surface-dispatch" },
        { source: "/", has: [{ type: "host", value: "old\\.digdug\\.do" }], destination: "/legacy-terminal" },
      ],
    };
  },
};

export default nextConfig;
