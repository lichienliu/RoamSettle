# Builder 身分資產總覽

本專案的首要目標是在 Base 上累積可歸戶的 builder 紀錄。此文件記錄所有**對外註冊的身分資產**、它們與 repo 的關聯、以及維護時的注意事項。clone 到任何環境都應先讀這份。

最後更新：2026-08-03。

## 核心身分

| 資產 | 值 |
|---|---|
| Builder 錢包 | Base Account（passkey）`0x6b501dd4a147e7ae9bf818d7c63ef68376b4501e` |
| Builder Code | `bc_15l5ddco`（ERC-8021；常數在 `lib/attribution.ts`） |
| Base Dashboard app id | `6a6f3515a8c4f2b6db3b3db0` |
| GitHub | `lichienliu`（舊名 `llc890410`，同一帳號改名） |
| Basename | `lichienliu.base.eth` |
| 正式站 | https://roamsettle.vercel.app（Vercel，push main 自動部署） |

## Basename（2026-08-03 註冊）

- `lichienliu.base.eth` 由 builder 錢包 0x6b50 持有，**效期至 2027-08-03**，10 字母級距每年約 0.0001 ETH——**到期前記得續約**
- addr 記錄與反向解析（primary name）皆已設定；注意新版名字用的 resolver 是 `0x426fA03f…b10875`，用舊版 L2Resolver 查會誤判成空記錄
- 選個人名而非產品名是刻意的：一個地址可持多個 basename，未來其他 app 不受限

## Base Dashboard（dashboard.base.org）

- 已註冊、網域已驗證、Builder Code 已核發（流程見 `docs/base-dev-registration.md`）
- 網域驗證靠 `app/layout.tsx` `metadata.other` 的 `base:app_id` meta tag——**不可移除**
- 待補：app icon、截圖、描述等 metadata
- 歸因統計：所有帶 dataSuffix 的交易由 Base indexer 自動歸戶到此 app，無需申報

## Talent Protocol（talent.app，2026-08-03 整備完成）

Base 生態的 builder 信譽/獎勵平台（Builder Score、Builder Rewards 活動）。

- **帳號**：handle `@llc890410.eth`（顯示名 Michael Liu base.eth）；已綁 X、Farcaster、GitHub（`lichienliu`）；錢包清單含 builder 錢包 0x6b50;真人驗證 Worldcoin + Coinbase 皆通過
- **Project「RoamSettle」**：分類 Fintech & Payments，網站已完成所有權驗證
  - 驗證靠 `app/layout.tsx` `metadata.other` 的 `talentapp:project_verification` meta tag——**不可移除**（移除後 Talent 重驗會失敗）
  - Data source 已掛 GitHub repo `lichienliu/RoamSettle`
  - **Smart contracts 刻意留空**：本專案非託管、無自有合約，鏈上只有用戶錢包對錢包的 USDC 轉帳；USDC 合約是 Circle 的，不可掛。未來若部署自有合約再補
- **Builder Rewards 資格三條件**：① Basename ✅ ② Builder Score ≥ 40（2026-08-03 時為 12，GitHub 重連後等重算）③ 真人驗證 ✅。活動一檔一檔開（如 Top Base Builders: January，2026-01 結束），沒有常駐活動時就是備妥資格等下一檔,達標後自動入榜、無需報名
- 曾踩坑：GitHub 帳號改名後 Talent 顯示舊名且抓不到貢獻資料,Refresh data 無效,需 Disconnect → 重新 Connect OAuth

## 里程碑紀錄

- **2026-08-02**：Sepolia 歸因實驗定案——Base Pay 不帶 suffix（棄用）,viem walletClient + dataSuffix 成功上鏈（詳見規格 §7 與 `/lab/attribution`）
- **2026-08-03**：v0.5 全流程驗收——首筆歸因結算付款 tx `0x5ac0167f55db0ac948e8f41554e63a3664a146a5335d13de35e31ef1657a4d7a`（Base Sepolia,4337 userOp,Builder Code suffix 以 contains 驗證於 callData 內,paymaster 代付 gas）
- **2026-08-03**：全 app 切換 Base Mainnet（PR #15,單一切換點 `lib/chain.ts`）
