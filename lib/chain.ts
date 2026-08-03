import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

// v0.5 開發鏈 = Base Sepolia;上 mainnet 時全 app 從這裡一起切換
export const chain = baseSepolia;

// SIWE 驗簽必須走這個 client(ERC-6492/1271 需要鏈上呼叫,
// passkey 智慧錢包的簽名用離線 ecrecover 驗不過)
export const publicClient = createPublicClient({ chain, transport: http() });

// 結算幣 = 原生 USDC(mainnet 換 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
export const USDC_ADDRESS =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;

export function txExplorerUrl(hash: string) {
  return `${chain.blockExplorers.default.url}/tx/${hash}`;
}
