import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

// v0.5 開發鏈 = Base Sepolia;上 mainnet 時全 app 從這裡一起切換
export const chain = baseSepolia;

// SIWE 驗簽必須走這個 client(ERC-6492/1271 需要鏈上呼叫,
// passkey 智慧錢包的簽名用離線 ecrecover 驗不過)
export const publicClient = createPublicClient({ chain, transport: http() });
