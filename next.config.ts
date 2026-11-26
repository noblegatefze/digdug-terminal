import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/surface-dispatch", destination: "https://feed.digdug.do/", permanent: false },
      { source: "/legacy-terminal", destination: "https://old.digdug.do/", permanent: false },
    ];
  },
};

export default nextConfig;
