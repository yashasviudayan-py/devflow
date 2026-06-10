/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@devflow/shared"],
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
