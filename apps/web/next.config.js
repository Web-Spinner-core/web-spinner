const million = require("million/compiler");
/**
 * @type {import('next').NextConfig}
 */
module.exports = million.next(
  {
    reactStrictMode: true,
    transpilePackages: ["@ui"],
    experimental: {
      serverActions: true,
    },
  },
  { auto: { rsc: true } }
);
