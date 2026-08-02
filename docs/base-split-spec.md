# Base Split — 專案規格文件（v0.5）

> 最後更新：2026-08-02
> 用途:本文件為 Claude Code 開發時的主要參考。建議放在 repo 根目錄或作為 CLAUDE.md 的基礎。

---

## 1. 專案背景與目標

- 開發者:資深 Android 工程師(Kotlin),第一次做 Web 全端與區塊鏈專案
- **首要目標:在 Base 鏈上累積真實、可歸戶的 builder 紀錄**(合約、交易歸因、GitHub 足跡),產品本身是載體
- 次要目標:做出一個朋友真的會用的旅遊分帳工具
- 非目標:賺錢、發幣、平台抽成

### Builder 紀錄的三個訊號來源(優先序)
1. **Builder Code 歸戶**:所有經由本 app 發起的鏈上交易帶上 dataSuffix
2. **已驗證合約**(v1.1 加入):`SettlementRegistry` 事件紀錄合約,部署於 Base mainnet 並在 Basescan verify
3. **公開 GitHub repo**:從第一天 public,commit 分散在時間軸上,不要擠在同一天

---

## 2. 產品定位

**一個支援旅行記帳、並用 Base 上的 USDC 完成朋友間結算的非託管 Web App。**

鐵律:**App 永遠不保管、不經手任何資金。** 付款是付款人錢包 → 收款人錢包的直接 USDC 轉帳,app 只負責記帳、計算、發起付款、驗證結果。

---

## 3. v0.5 功能範圍(已確認)

### 角色
- **發起人**:建立旅程,需要 Base 帳號(Sign in with Base)
- **一般旅伴**:點邀請連結 + 輸入暱稱即可加入,**不需要錢包**;只有最後付款那一步才需連接錢包
- 收款人必須有錢包地址才能收 USDC

### 使用流程
1. **登入**:Sign in with Base(SIWE,後端驗簽,見 §6)
2. **建立旅程**:名稱、日期、**單一記帳幣別**(如 JPY)→ 產生邀請連結
3. **旅伴加入**:點連結 → 暱稱 → 完成(免錢包、免安裝)
4. **記帳**:付款人、項目、金額、勾選分帳成員(預設全員)→ **平均分攤**
5. **即時淨餘額**:首頁顯示每人 +/−;帳目可改可刪,即時重算
6. **結算**(發起人觸發):
   - 帳目**鎖定為不可變快照**(Settlement Batch);之後新增的支出進下一輪
   - 手動輸入記帳幣別 → USDC 匯率
   - 產生**最少轉帳次數**建議(greedy 淨額配對即可,不需全域最佳解)
7. **付款**:欠款人連接錢包 → Base Pay 轉 USDC 給收款人 → 後端驗證交易 → 標記結清
   - 支援收款人手動標記「已用其他方式結清」(現金等線下情況)
8. **完成**:每筆付款附鏈上交易連結;全部結清 → 旅程標記完成,永久可回顧

### v0.5 明確排除
混合幣別記帳、指定金額/比例分帳、自動匯率 API、聊天、OCR、推播、分期/部分付款/退款、USDC 以外幣種、平台餘額/儲值/提領/託管、發 Token、NFT、DeFi。

---

## 4. 技術棧(已定案)

| 層 | 選擇 | 備註 |
|---|---|---|
| 語言 | TypeScript(strict) | |
| 框架 | Next.js(App Router,全端 monolith) | 前端 + Route Handlers 一個 repo |
| UI | React + Tailwind CSS + shadcn/ui | |
| Server state | TanStack Query | |
| DB | PostgreSQL(Neon 免費層) | |
| ORM | **Drizzle**(不用 Prisma) | 貼近 SQL,好 debug |
| 鏈互動 | viem(**>= 2.45.0**,dataSuffix 需要)+ wagmi | |
| Base SDK | @base-org/account | Sign in with Base、Base Pay `pay()` / `getPaymentStatus()` |
| Hosting | Vercel | git push 即部署 |
| 鏈 | Base Sepolia(開發)→ Base Mainnet(上線) | |
| 後端框架 | 不用 NestJS | Route Handlers 夠用 |

### 型態定案
- **標準 Web App,不是 Farcaster Mini App。** 2026/4/9 起 Base App 將所有 app 一律視為 standard web app + wallet,Mini App 規格已淘汰。行動版 Web 做好 + 註冊 Base Dashboard(base.dev)即可同時觸及瀏覽器與 Base App 內的使用者
- 不做 Android/iOS 原生

---

## 5. 關鍵工程規則(不可妥協)

1. **非託管**:任何版本都不得出現平台餘額、儲值、代管、合約持幣
2. **金額不用 JS number**:所有金額以最小單位整數字串儲存與運算(USDC 6 位小數:1 USDC = 1_000_000 units);DB 用 numeric/bigint;運算用 BigInt 或 decimal 庫
3. **結算快照不可變**:開始結算即鎖定該批帳目;付款綁定快照,不受後續帳目變動影響
4. **後端付款驗證**,不信任前端回報。必查:
   - tx 存在且狀態 completed/confirmed
   - sender == 登入者綁定地址、recipient、amount、network(Base)全部相符
   - `transaction_id` 在 DB 有 **UNIQUE constraint**,防同一筆交易重複核銷
   - 該 settlement 尚未被標記已付
5. **SIWE 正確實作**:後端產 nonce → 前端錢包簽 SIWE 訊息 → 後端驗簽 + 驗 nonce → 建 session。**不得**只憑前端拿到地址就視為登入
6. **Builder Code 全交易掛載**(見 §7)

---

## 6. 資料模型草稿

```
users            id, wallet_address(unique, nullable for未連錢包成員), display_name, created_at
trips            id, name, start_date, end_date, base_currency, creator_user_id, invite_token(unique), status
trip_members     id, trip_id, user_id(nullable), nickname, wallet_address(nullable), role
expenses         id, trip_id, payer_member_id, title, amount_units(bigint), created_by, occurred_at, deleted_at
expense_shares   id, expense_id, member_id            -- 勾選誰分攤;平均分攤由後端計算
settlement_batches  id, trip_id, locked_at, fx_rate_numerator, fx_rate_denominator, status
settlement_items    id, batch_id, debtor_member_id, creditor_member_id, amount_usdc_units(bigint), status
settlement_payments id, settlement_item_id, payer_address, recipient_address,
                    expected_amount_units, actual_amount_units,
                    transaction_id UNIQUE, status, created_at, confirmed_at, settled_offline(bool)
```

備註:匯率以分子/分母整數存,避免浮點;快照鎖定時將當批 expenses 複製或以版本標記凍結。

---

## 7. Builder Code 整合(本專案的命脈)

- 到 **base.dev(Base Dashboard)** 註冊專案 → 取得 Builder Code(格式如 `bc_xxxxxxxx`,位於 Settings → Builder Code)
- 網頁環境:在 wagmi config 掛 dataSuffix,之後所有交易自動附加:

```ts
import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { Attribution } from "ox/erc8021";

const DATA_SUFFIX = Attribution.toDataSuffix({ codes: ["YOUR-BUILDER-CODE"] });

export const config = createConfig({
  chains: [base],
  dataSuffix: DATA_SUFFIX,
  transports: { [base.id]: http() },
});
```

- Base App 內:已註冊 app 的交易由 Base App 自動歸因,不需額外處理
- **⚠️ 未驗證的風險**:Base Pay 的 `pay()` 獨立於 wagmi,**不能假設**瀏覽器中的 Base Pay 交易會帶上 wagmi 的 dataSuffix
- **第 1–2 週必做的實驗**(在寫完整產品之前):做一個最陽春付款頁,在 Sepolia 用 Base Pay 發一筆,到 Base Dashboard 看是否歸因成功
  - 成功 → 照原計畫
  - 失敗 → 結算付款改用 wagmi/viem 自組 ERC-20 transfer(UX 稍差但歸戶保住),Base Pay 僅作備選

---

## 8. Roadmap

| 版本 | 內容 |
|---|---|
| **W1–2** | 專案跑起來 + 部署 Vercel + Sign in with Base + **Builder Code 歸因實驗** |
| **v0.5** | §3 全流程在 Sepolia 走通 → 小額上 Mainnet,找 3–10 位朋友真實使用 |
| **v1** | 指定金額/比例分帳、多幣別記帳、自動匯率 |
| **v1.1** | `SettlementRegistry` 合約(Solidity + Foundry):純事件紀錄、不碰資金,部署 Base mainnet + Basescan verify;每筆結清後發 `recordSettlement()`(可走 Paymaster gasless) |
| 持續 | 每週 public commit、build log 發文、累積使用量後投 Base Builder Grants |

### SettlementRegistry 介面草稿(v1.1)
```solidity
event SettlementRecorded(
    bytes32 indexed tripId,
    bytes32 indexed settlementId,
    address indexed payer,
    address recipient,
    uint256 amount,
    bytes32 metadataHash
);
```
只記錄、不持幣、無 approve 流程。

---

## 9. 已建立/待建立的 Builder 身分檔案

- [ ] Basename(.base.eth)
- [ ] Base Dashboard(base.dev)註冊 + Builder Code
- [ ] Coinbase Developer Platform 帳號(Paymaster / RPC 用)
- [ ] Talent Protocol profile(綁 GitHub + 錢包)
- [ ] Public GitHub repo,首 commit

## 10. 參考連結

- Base 文件:https://docs.base.org
- 標準 Web App 遷移指南:https://docs.base.org/apps/guides/migrate-to-standard-web-app
- Builder Codes(app 開發者):https://docs.base.org/apps/builder-codes/app-developers
- Base Dashboard:https://www.base.dev
- Base Account SDK(@base-org/account):Sign in with Base / Base Pay
- Builder Grants:回溯型,1–5 ETH,做出成果後可被提名
