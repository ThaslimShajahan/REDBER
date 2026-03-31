import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Allow /embed pages to be loaded in iframes from any origin
        source: "/embed/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Content-Security-Policy", value: "frame-ancestors *;" }
        ],
      },
      {
        source: "/chat/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Content-Security-Policy", value: "frame-ancestors *;" }
        ],
      },
      {
        source: "/widget.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" }
        ],
      }
    ];
  },
};

export default nextConfig;
