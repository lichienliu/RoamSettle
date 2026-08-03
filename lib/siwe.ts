export type BaseSiweFields = {
  domain: string;
  address: `0x${string}`;
  uri: string;
  chainId: number;
  nonce: string;
};

/**
 * 解析 Base Account(keys.coinbase.com)產生的 SIWE 訊息。
 *
 * 不用 viem/siwe 的 parseSiweMessage:Base 的訊息省略了 EIP-4361 的
 * Version 與 Issued At 行,strict parser 會整段解析失敗(2026-08-03 實測,
 * 訊息只有 domain/address/URI/Chain ID/Nonce 五個部分)。
 * 這裡只負責取出欄位;所有安全檢查(nonce 單次有效、domain 綁定、
 * chainId、鏈上驗簽)都在 /api/auth/verify 執行。
 */
export function parseBaseSiweMessage(message: string): BaseSiweFields | null {
  const lines = message.split("\n");
  const domain = lines[0]?.match(
    /^(.+) wants you to sign in with your Ethereum account:$/,
  )?.[1];
  const address = lines[1];
  const uri = message.match(/^URI: (\S+)$/m)?.[1];
  const chainId = message.match(/^Chain ID: (\d+)$/m)?.[1];
  const nonce = message.match(/^Nonce: ([a-zA-Z0-9]+)$/m)?.[1];

  if (
    !domain ||
    !address ||
    !/^0x[a-fA-F0-9]{40}$/.test(address) ||
    !uri ||
    !chainId ||
    !nonce
  ) {
    return null;
  }
  return {
    domain,
    address: address as `0x${string}`,
    uri,
    chainId: Number(chainId),
    nonce,
  };
}
