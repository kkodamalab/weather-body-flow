# Weather / Body Flow

静的Webプロトタイプです。ローカルサーバーで `index.html` を開いてください（ES modules とカメラのため、`file://` ではなく localhost を推奨）。

- `js/pose-tracker.js`: MediaPipe Pose Landmarker とマウス・フォールバック
- `js/flow-field.js`: 環境風、身体中心速度、両手の渦、ノイズを合成する流れ場と描画
- `js/weather-service.js`: APIキー不要の Open-Meteo 接続
- `js/app.js`: UI、仮想媒質、レンダーループの統合

湿度からの仮想粘性は `smoothstep(30, 60, humidity)`。実気象の空気粘性を推定するものではありません。
