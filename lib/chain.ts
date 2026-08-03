import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

// 正式鏈 = Base Mainnet(v0.5 開發期為 Base Sepolia,2026-08 切換)
// 全 app 的鏈設定只從這裡出去:SIWE 驗簽、付款核銷、錢包連線一起切
export const chain = base;

// SIWE 驗簽必須走這個 client(ERC-6492/1271 需要鏈上呼叫,
// passkey 智慧錢包的簽名用離線 ecrecover 驗不過)
export const publicClient = createPublicClient({ chain, transport: http() });

// 結算幣 = 原生 USDC(Sepolia 測試幣:0x036CbD53842c5426634e7929541eC2318f3dCF7e)
export const USDC_ADDRESS =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

export function txExplorerUrl(hash: string) {
  return `${chain.blockExplorers.default.url}/tx/${hash}`;
}
