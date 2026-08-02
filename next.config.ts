import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @base-org/account 只在瀏覽器端動態載入(付款彈窗),其 node 入口會拉進
  // @coinbase/cdp-sdk 等 server 用不到且缺 optional deps 的模組,必須排除於 server bundle
  serverExternalPackages: ["@base-org/account"],
};

export default nextConfig;
