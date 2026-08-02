# RoamSettle

旅行記帳 + Base 鏈上 USDC 結算的非託管 Web App。

Travel expense splitting with non-custodial USDC settlement on [Base](https://base.org).

- 記帳免錢包：旅伴點邀請連結、輸入暱稱即可加入，只有付款那一步才需連接錢包
- 非託管：付款是付款人錢包 → 收款人錢包的直接 USDC 轉帳，app 永不經手資金
- 結算產生最少轉帳次數建議，每筆付款附鏈上交易連結

## Docs

- [專案規格 v0.5](docs/base-split-spec.md)
- [Base Dashboard 註冊流程](docs/base-dev-registration.md)

## Development

```bash
npm install
npm run dev    # http://localhost:3000
npm run build
npm run lint
```

## Status

🚧 UI 原型階段 — 11 張畫面（Onchain Swiss 設計方向）已可點擊走完全流程，資料為 mock；後端 / 鏈上整合尚未開始。
