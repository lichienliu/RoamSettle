# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概況

**RoamSettle**：支援旅行記帳、用 Base 鏈上 USDC 完成朋友間結算的**非託管** Web App。

- 首要目標：在 Base 鏈上累積真實、可歸戶的 builder 紀錄（Builder Code 交易歸因、已驗證合約、公開 GitHub 足跡），產品本身是載體
- 完整規格：`docs/roamsettle-spec.md`（v0.5，開發時的主要參考）
- Base Dashboard 註冊與 Builder Code 取得流程：`docs/base-dev-registration.md`

**目前狀態**：UI 原型完成（11 張畫面、mock 資料）；已部署 https://roamsettle.vercel.app（push main 自動部署）；Base Dashboard 已註冊並取得 Builder Code。下一步：Sepolia 歸因實驗（規格 §7）。

## Builder 身分（已定案）

- Builder 錢包：Base Account `0x6b501dd4a147e7ae9bf818d7c63ef68376b4501e`（passkey）
- Builder Code：`bc_15l5ddco`；app id：`6a6f3515a8c4f2b6db3b3db0`（常數在 `lib/attribution.ts`）
- 所有鏈上整合必掛 dataSuffix，見 `lib/attribution.ts` 註解與規格 §7

## 技術棧（已定案，見規格 §4）

- TypeScript (strict) + Next.js App Router（全端 monolith，前端 + Route Handlers 同一 repo）
- React + Tailwind CSS + shadcn/ui、TanStack Query
- PostgreSQL (Neon) + **Drizzle ORM**（不用 Prisma、不用 NestJS）
- viem（**>= 2.45.0**，dataSuffix 需要）+ wagmi + @base-org/account（Sign in with Base、Base Pay）
- 部署 Vercel；鏈：Base Sepolia（開發）→ Base Mainnet（上線）
- 型態為**標準 Web App**，不是 Farcaster Mini App，不做原生 App

## 不可妥協的工程規則（規格 §5）

1. **非託管**：app 永不保管、經手資金；不得出現平台餘額、儲值、代管、合約持幣
2. **金額不用 JS number**：以最小單位整數儲存與運算（USDC 6 位小數）；DB 用 numeric/bigint，運算用 BigInt；匯率以分子/分母整數存
3. **結算快照不可變**：開始結算即鎖定該批帳目，付款綁定快照
4. **後端付款驗證**，不信任前端回報：驗 tx 狀態、sender/recipient/amount/network 相符；`transaction_id` 必須有 UNIQUE constraint 防重複核銷
5. **SIWE 正確實作**：後端產 nonce → 錢包簽名 → 後端驗簽 + 驗 nonce → 建 session；不得只憑前端地址視為登入
6. **Builder Code 全交易掛載**：wagmi config 掛 dataSuffix（`ox/erc8021` 的 `Attribution.toDataSuffix`），這是專案命脈（規格 §7）

## 待驗證的關鍵風險

Base Pay 的 `pay()` 獨立於 wagmi，**不能假設**瀏覽器中的 Base Pay 交易會帶上 dataSuffix。開發初期必須先在 Sepolia 實測歸因；失敗則改用 wagmi/viem 自組 ERC-20 transfer（詳見兩份文件的警告段落）。

## Git 工作流程（GitHub Flow）

- `main` 永遠保持可部署狀態（Vercel production 追蹤 main）；**不直接 commit main**
- 所有變更開分支 → push → 開 PR → squash merge 進 main
- 分支命名：`feat/xxx`、`fix/xxx`、`docs/xxx`、`chore/xxx`
- 版本節點打 tag（`v0.5`、`v1.0`⋯），對應規格 §8 的 roadmap
- 不採用 Git Flow（solo 開發不需要 develop/release/hotfix 長駐分支）

## 其他慣例

- git commit 使用個人信箱 `llc890410@gmail.com`（已設在 repo 局部 config）
- Repo 從第一天 public，commit 分散在時間軸上，不要擠在同一天
