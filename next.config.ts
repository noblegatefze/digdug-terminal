import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/surface-dispatch", destination: "https://feed.digdug.do/", permanent: false },
      { source: "/legacy-terminal", destination: "https://old.digdug.do/", permanent: false },
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
