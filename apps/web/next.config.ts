import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * The workspace packages ship as TypeScript source rather than a build, so
   * Next compiles them itself. This is what lets `@snt/ui` use CSS Modules —
   * they are processed as part of this app's build.
   */
  transpilePackages: ['@snt/ui', '@snt/core', '@snt/assets'],

  eslint: {
    // No lint config yet; `pnpm typecheck` is the gate for now.
    ignoreDuringBuilds: true,
  },

  /**
   * Shops are called stores: their pages moved from /shop to /store. Old
   * links, shared or saved, still land on the right page.
   */
  async redirects() {
    return [
      { source: '/shop/:slug', destination: '/store/:slug', permanent: true },
      { source: '/console/shop', destination: '/console/store', permanent: true },
    ];
  },

  devIndicators: {
    // Default is bottom-left, directly on top of the Browse tab.
    position: 'bottom-right',
  },
};

export default nextConfig;
