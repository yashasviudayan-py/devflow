/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@devflow/shared"],
  // Same-origin API proxy. In production the browser calls the API at the
  // relative `/api/*` (see getApiBaseUrl), and Next.js rewrites that to the real
  // backend origin server-side. The browser therefore only ever talks to the
  // Vercel origin, so the auth cookie stays *first-party* and is not blocked as a
  // cross-site/third-party cookie (Safari, Chrome incognito, etc.).
  //
  // The destination is the absolute backend URL in `NEXT_PUBLIC_API_URL`
  // (e.g. https://devflow-1wg5.onrender.com). We only register the rewrite when
  // that var is an absolute origin: in local dev it points at localhost and the
  // browser calls the API directly, so no proxy is needed — and skipping it here
  // also guards against an accidental `NEXT_PUBLIC_API_URL=/api` self-loop.
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl || !/^https?:\/\//.test(apiUrl)) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
  webpack: (config) => {
    // @devflow/shared resolves to TypeScript source that uses ESM ".js"
    // import specifiers, so webpack must map them back to ".ts" files.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
