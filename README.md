# even-g2-meal-log

Even G2（スマートグラス）に、今日の食事の「残りカロリーと PFC」を表示するアプリです。作りかけです。

## できること

- 今日の残り（kcal・P・F・C）と、合計を表示します。
- タップで再読み込み、ダブルタップで終了します。

## データ

`public/meal.json` を読みます。個人データなので、このファイルは git 管理外です（`.gitignore`）。形式は `public/meal.sample.json` を見てください。

```json
{"date":"2026-01-01","updated":"12:00","target":{"kcal":2000,"p":150,"f":60,"c":230},"total":{"kcal":800,"p":60,"f":20,"c":100}}
```

## 動かし方

```bash
npm install
cp public/meal.sample.json public/meal.json
npm run dev
```

- シミュレーター：別のターミナルで `npm run simulate`（ポートは 5174）
- 実機（G2）：`npx evenhub qr --url http://<PCのLAN IP>:5174` を実行し、Even Realities アプリの Even Hub タブ → Scan QR で読み取ります（スマホと PC は同じ Wi-Fi。PC で dev サーバーが動いている間だけ表示できます）

## 注意

- 個人用の実験です。医療・健康上の判断には使わないでください。
- ライセンスは未設定です（もとにしたテンプレートのライセンスを確認中）。
