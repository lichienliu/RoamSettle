import { Attribution } from "ox/erc8021";

/**
 * Base Builder Code attribution(ERC-8021)— 本專案的命脈(規格 §7)。
 *
 * 所有經由本 app 發起的鏈上交易都必須掛上這個 dataSuffix,
 * Base Dashboard 才能把交易歸因到 RoamSettle。
 * 接 wagmi 時:createConfig({ dataSuffix: Attribution.toDataSuffix({ codes: [BUILDER_CODE] }) })
 * (viem >= 2.45.0,import { Attribution } from "ox/erc8021")
 */
export const BUILDER_CODE = "bc_15l5ddco";

/**
 * 實際掛載用的 dataSuffix,由 BUILDER_CODE 即時計算。
 * 未來 wagmi config 與所有自組交易都從這裡取用;
 * 與下方 REFERENCE 的一致性由 /lab/attribution 頁載入時斷言。
 */
export const BUILDER_DATA_SUFFIX = Attribution.toDataSuffix({
  codes: [BUILDER_CODE],
});

/** Base Dashboard app id(網域驗證 meta tag 用,已埋在 app/layout.tsx) */
export const BASE_APP_ID = "6a6f3515a8c4f2b6db3b3db0";

/**
 * Dashboard 顯示的參考 dataSuffix(Encoded String)。
 * 接 wagmi 後第一件事:斷言 Attribution.toDataSuffix({ codes: [BUILDER_CODE] })
 * 與此值一致,不一致代表編碼方式有變,必須重查文件。
 */
export const BUILDER_CODE_DATA_SUFFIX_REFERENCE =
  "0x62635f31356c356464636f0b0080218021802180218021802180218021";
