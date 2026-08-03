# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概況

**RoamSettle**：支援旅行記帳、用 Base 鏈上 USDC 完成朋友間結算的**非託管** Web App。

- 首要目標：在 Base 鏈上累積真實、可歸戶的 builder 紀錄（Builder Code 交易歸因、已驗證合約、公開 GitHub 足跡），產品本身是載體
- 完整規格：`docs/roamsettle-spec.md`（v0.5，開發時的主要參考）
- Base Dashboard 註冊與 Builder Code 取得流程：`docs/base-dev-registration.md`
- 對外 builder 身分資產總覽（basename、Talent Protocol、驗證 meta tag 位置）：`docs/builder-profile.md`

**目前狀態**：**v0.5 已完成並驗收（2026-08-03）**——SIWE 登入、記帳、結算引擎（快照鎖定/匯率/最少轉帳/線下結清）、USDC 鏈上付款 + 後端核銷全部上線；全流程實測走通，首筆歸因付款於 Sepolia 驗證成功（tx `0x5ac0167f…7a4d7a`，Builder Code suffix 已上鏈）。**2026-08-03 全 app 切換 Base Mainnet**（單一切換點 `lib/chain.ts`）。下一步：找 3–10 位朋友做 mainnet 小額實測；Base Dashboard 補 app metadata。

## Builder 身分（已定案）

- Builder 錢包：Base Account `0x6b501dd4a147e7ae9bf818d7c63ef68376b4501e`（passkey）
- Builder Code：`bc_15l5ddco`；app id：`6a6f3515a8c4f2b6db3b3db0`（常數在 `lib/attribution.ts`）
- 所有鏈上整合必掛 dataSuffix，見 `lib/attribution.ts` 註解與規格 §7
- Basename：`lichienliu.base.eth` 由 builder 錢包持有（效期至 2027-08）；Talent Protocol 已立案 project「RoamSettle」——細節與注意事項見 `docs/builder-profile.md`
- `app/layout.tsx` 的 `metadata.other` 內有兩個**所有權驗證 meta tag**（`base:app_id`、`talentapp:project_verification`），**不可移除**

## 技術棧（已定案，見規格 §4）

- TypeScript (strict) + Next.js App Router（全端 monolith，前端 + Route Handlers 同一 repo）
- React + Tailwind CSS + shadcn/ui、TanStack Query
- PostgreSQL (Neon) + **Drizzle ORM**（不用 Prisma、不用 NestJS）
- viem（**>= 2.45.0**，dataSuffix 需要）+ wagmi + @base-org/account（Sign in with Base、Base Pay）
- 部署 Vercel；鏈：**Base Mainnet**（2026-08-03 起；v0.5 開發期用 Base Sepolia，單一切換點 `lib/chain.ts`，`/lab/attribution` 刻意留在 Sepolia 當歷史紀錄）
- 型態為**標準 Web App**，不是 Farcaster Mini App，不做原生 App

## 不可妥協的工程規則（規格 §5）

1. **非託管**：app 永不保管、經手資金；不得出現平台餘額、儲值、代管、合約持幣
2. **金額不用 JS number**：以最小單位整數儲存與運算（USDC 6 位小數）；DB 用 numeric/bigint，運算用 BigInt；匯率以分子/分母整數存
3. **結算快照不可變**：開始結算即鎖定該批帳目，付款綁定快照
4. **後端付款驗證**，不信任前端回報：驗 tx 狀態、sender/recipient/amount/network 相符；`transaction_id` 必須有 UNIQUE constraint 防重複核銷
5. **SIWE 正確實作**：後端產 nonce → 錢包簽名 → 後端驗簽 + 驗 nonce → 建 session；不得只憑前端地址視為登入
6. **Builder Code 全交易掛載**：wagmi config 掛 dataSuffix（`ox/erc8021` 的 `Attribution.toDataSuffix`），這是專案命脈（規格 §7）

## 歸因實驗結論（2026-08-02 已定案）

Sepolia 實測（規格 §7 有完整紀錄）：**Base Pay `pay()` 不帶 dataSuffix**（付款成功但無歸因）；**viem walletClient 掛 dataSuffix 成功上鏈**。因此結算付款一律用 wagmi/viem 自組 ERC-20 transfer + dataSuffix，不用 Base Pay。附帶發現：測試網上兩路徑 gas 皆由 paymaster 代付，用戶端可能不需持有 ETH（mainnet 待確認）。

## Git 工作流程（GitHub Flow）

- `main` 永遠保持可部署狀態（Vercel production 追蹤 main）；**不直接 commit main**
- 所有變更開分支 → push → 開 PR → squash merge 進 main
- 分支命名：`feat/xxx`、`fix/xxx`、`docs/xxx`、`chore/xxx`
- 版本節點打 tag（`v0.5`、`v1.0`⋯），對應規格 §8 的 roadmap
- 不採用 Git Flow（solo 開發不需要 develop/release/hotfix 長駐分支）

## 其他慣例

- git commit 使用個人信箱 `llc890410@gmail.com`（已設在 repo 局部 config）
- Repo 從第一天 public，commit 分散在時間軸上，不要擠在同一天
