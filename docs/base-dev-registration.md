# Base Dashboard(base.dev)註冊與上架流程

> 最後查證:2026-08-02。Base 的產品名稱與流程變動很快,實際操作前建議再對照 docs.base.org 一次。

## 名詞先弄清楚

- **base.dev 已改名為 Base Dashboard**,定位:「註冊你的 app,在 Base 上獲得獎勵」。舊文件寫 base.dev、新文件寫 Base Dashboard,是同一個東西
- 2026/4/9 起,Base App 把所有 app 一律當**標準 Web App** 處理,Farcaster Mini App 規格已淘汰。上架 = 在 Base Dashboard 註冊你的網頁 app,不需要 manifest、不需要審查上架流程(非 App Store 模式)

## 註冊時機

**不用等產品做完。** 建議在專案第 1 週就註冊,原因:
1. 拿到 Builder Code 才能開始做歸因實驗(這是專案的核心假設)
2. 註冊本身就是紀錄的一部分,越早越好
3. metadata 之後隨時可以補

## 流程

### Step 1:前置
- 準備一個錢包(建議同時領好 Basename)
- 用該錢包登入 https://www.base.dev

### Step 2:建立專案、取得 Builder Code
- ⚠️ **2026-08-02 實測更新**:與本文件原記載不同,現在的 Base Dashboard 要求**先加入並驗證 app domain 才會生成 Builder Code**(Settings → Builder Codes → Add Domain)
- 驗證方式:Dashboard 產生 `<meta name="base:app_id" content="<app_id>">`,埋進網站 `<head>` 後回 Dashboard 按驗證
- 因此實際順序:註冊 app → 部署(拿到網域)→ 埋 meta tag → 驗證網域 → 取得 Builder Code
- RoamSettle 的 app id:`6a6f3515a8c4f2b6db3b3db0`(已埋在 `app/layout.tsx` metadata)
- Builder Code 的作用:鏈級歸因——證明哪些交易是你的 app 帶來的,並且是 Base 未來獎勵計畫的信任來源

### Step 3:填寫 app metadata(正式上架需齊全)
官方遷移指南列出的完整清單:
- [ ] Name
- [ ] Icon
- [ ] Tagline
- [ ] Description
- [ ] Screenshots
- [ ] Category
- [ ] **Primary URL**(你部署在 Vercel 的正式網址)
- [ ] Builder Code 已綁定

### Step 4:程式端整合(讓交易真的歸到你頭上)
兩條路徑,依使用者從哪裡打開你的 app:

**A. 使用者在 Base App 內開啟**
已註冊的 app,交易由 Base App 自動附加你的 Builder Code,不需寫程式。

**B. 使用者用一般瀏覽器開啟(你的主要情境)**
需自行在交易掛 dataSuffix。要求 **viem >= 2.45.0**:

```ts
import { Attribution } from "ox/erc8021";
const DATA_SUFFIX = Attribution.toDataSuffix({ codes: ["你的-BUILDER-CODE"] });
// 掛在 wagmi createConfig 的 dataSuffix,或 viem createWalletClient 的 dataSuffix
// 之後該 client 發出的所有交易自動帶上
```

**⚠️ 已知未解問題**:Base Pay(`pay()`)獨立於 wagmi 運作,官方文件未保證瀏覽器中的 Base Pay 交易會套用你的 dataSuffix。**必須實測**:Sepolia 發一筆 Base Pay 付款 → 到 Base Dashboard 的分析頁看是否歸因。失敗就改用 wagmi/viem 自組 USDC transfer。

### Step 5:驗收清單(官方標準)
對照官方「已完成遷移/上架」的檢核:
- [ ] 錢包連線與合約互動使用 wagmi + viem
- [ ] 驗證使用 SIWE
- [ ] 專案已在 Base Dashboard 註冊、Primary URL 已設定
- [ ] Name / icon / tagline / screenshots / category / description / builder code 全部填齊
- [ ] (若用推播)改用 Base Dashboard 的 Notifications API,以 wallet address 發送

## ✅ RoamSettle 註冊紀錄(2026-08-02 完成)

- **Builder 錢包**:Base Account `0x6b501dd4a147e7ae9bf818d7c63ef68376b4501e`(passkey;使用者知情選用既有帳號)
- **App id**:`6a6f3515a8c4f2b6db3b3db0`
- **已驗證網域**:`roamsettle.vercel.app`(Vercel,push main 自動部署)
- **Builder Code**:`bc_15l5ddco`(常數收在 `lib/attribution.ts`)
- 待補 metadata:icon、screenshots、category、description

## 上架之後

- **Base Dashboard 分析頁**:追蹤你的 app 歸因到的交易量——這就是你的「成績單」,未來獎勵計畫擴大時吃的是這份資料
- **Builder Grants**:回溯型 1–5 ETH,不用寫提案;有真實使用量後,作品可被提名
- **Base Batches**:加速器,下一梯開放時可報名
- **Talent Protocol**:確保 profile 綁定的錢包 == 部署合約/註冊 Dashboard 的錢包,訊號才會匯流到同一個身分

## 參考

- Base Dashboard:https://www.base.dev
- Builder Codes 整合文件:https://docs.base.org/apps/builder-codes/app-developers
- 標準 Web App 指南:https://docs.base.org/apps/guides/migrate-to-standard-web-app
