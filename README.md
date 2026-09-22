# math-115-entry

這是一個獨立的學生數學入口，不會放入或修改既有的 `math-ebook-hub` 專案。

學生操作流程：

1. 點選 A 組或 B 組。
2. 點選日期。
3. 進入該日期的上課教材或回家作業。

## Google 試算表

入口資料來自 Google 試算表「115數學教材入口清單」的「入口清單」分頁。

每一筆資料填寫一列：

| 欄位 | 填寫方式 |
| --- | --- |
| 組別 | A組或B組 |
| 日期 | 該次上課或作業日期 |
| 使用情境 | 上課使用或回家作業 |
| 教材名稱 | 學生看到的名稱 |
| 網頁連結 | 完整的 `https://` 網址 |
| 是否顯示 | 填「是」才會出現在學生入口 |

第一次使用前，請在試算表選擇「檔案」→「共用」→「發布到網路」，發布「入口清單」分頁。試算表只放教材資料，不要放學生姓名或其他個人資料。

## 建立獨立 GitHub 專案

請建立一個新的 repository，名稱使用：

```text
math-115-entry
```

把這四個檔案直接放在新 repository 的最外層：

```text
math-115-entry/
├── index.html
├── styles.css
├── app.js
└── README.md
```

啟用 GitHub Pages 後，預計網址是：

```text
https://ting03040929-cmyk.github.io/math-115-entry/
```

原本的網址會維持不變：

```text
https://ting03040929-cmyk.github.io/math-ebook-hub/
```

目前尚未替你推送到 GitHub；需要在可以操作 GitHub 的電腦建立新 repository 並上傳檔案。
