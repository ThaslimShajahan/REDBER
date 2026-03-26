import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Applies to the iframed chatbot pages
        source: "/embed/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          }
        ],
      },
      {
        // Applies to the widget bootstrap script
        source: "/widget.js",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          }
        ],
      }
    ];
  },
};

export default nextConfig;
