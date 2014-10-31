Babyry-CloudCode
================
構築@20141031 by kenji.suzuki

reference : https://parse.com/docs/hosting_guide#webapp

1. ここ(https://parse.com/docs/hosting_guide#started-project)でアプリセットアップ
2. express install
  $ parse generate express
3. 本番ようにproductionエイリアス設定
  $ parse add production
  1: Babyry
  2: BabyryDev
  3: Commander
  4: Tabaco
  Select an App: 1
4. .gitignoreにglobal.json追加
