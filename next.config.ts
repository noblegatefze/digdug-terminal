import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
