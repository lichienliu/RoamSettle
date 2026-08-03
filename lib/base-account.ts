import { chain } from "@/lib/chain";

/**
 * Base Account SDK 的前端進入點,登入 / 綁定錢包 / 付款共用。
 * SDK 只在瀏覽器動態載入(SSR 會炸,見 next.config serverExternalPackages)。
 */

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

let providerPromise: Promise<Eip1193Provider> | null = null;

export function getBaseAccountProvider(): Promise<Eip1193Provider> {
  providerPromise ??= import("@base-org/account").then(
    ({ createBaseAccountSDK }) =>
      createBaseAccountSDK({
        appName: "RoamSettle",
        appChainIds: [chain.id],
      }).getProvider() as Eip1193Provider,
  );
  return providerPromise;
}

/**
 * 取後端 nonce → 錢包 wallet_connect 簽 SIWE。
 * 回傳的 message/signature 交給 /api/auth/verify(登入)或 /api/auth/link(綁定),
 * 前端拿到的 address 只做顯示,不做信任依據(規則 #5)。
 */
export async function requestSiwePayload(): Promise<{
  message: string;
  signature: string;
}> {
  const { nonce } = await fetch("/api/auth/nonce", { method: "POST" }).then(
    (r) => r.json(),
  );
  const provider = await getBaseAccountProvider();

  const { accounts } = (await provider.request({
    method: "wallet_connect",
    params: [
      {
        version: "1",
        capabilities: {
          signInWithEthereum: {
            nonce,
            chainId: `0x${chain.id.toString(16)}`,
          },
        },
      },
    ],
  })) as {
    accounts: {
      address: string;
      capabilities: {
        signInWithEthereum: { message: string; signature: string };
      };
    }[];
  };

  return accounts[0].capabilities.signInWithEthereum;
}
