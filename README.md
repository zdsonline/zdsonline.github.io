# 简易收音机

纯 HTML/CSS/JavaScript，无构建步骤，可直接部署到 GitHub Pages。

## 目录

```text
simple-radio/
├── index.html
├── manifest.json
├── sw.js
├── css/
│   └── app.css
├── js/
│   ├── app.js
│   └── stations.js
└── icons/
    ├── apple-touch-icon.png
    ├── icon-192.png
    ├── icon-512.png
    └── icon.svg
```

## 部署

将目录中的文件提交到 GitHub 仓库，进入仓库 Settings → Pages，选择要发布的分支和目录。必须通过 HTTPS 页面访问；不要直接双击打开 `index.html`。

## iPhone 添加到主屏幕

1. 用 Safari 打开 GitHub Pages 地址。
2. 点分享按钮 →“添加到主屏幕”。
3. 如有“作为网页 App 打开”选项，可开启后添加。
4. 首次至少成功联网打开一次，让 Service Worker 安装并缓存文件；建议点开一个频道确认应用可用。

## 更新版本

每次发布新版本时，至少修改 `sw.js` 顶部 `CACHE_VERSION`，例如 `radio-shell-v1.0.1`；建议同时修改 `js/app.js` 中的 `APP_VERSION`。提交后，浏览器在下一次联网访问时检查 Service Worker 更新并缓存新版本。已打开的旧页面不一定会立刻切换；重新打开页面通常可使用新版本。

Service Worker 不能让 iPhone 在从未缓存过应用时离线首次打开，也不能保证音频在断网时继续播放。缓存只保存应用文件，不保存直播音频。

## 电台列表

编辑 `js/stations.js` 中的 `window.RADIO_STATIONS`。电台地址是否能播放取决于服务端、格式、网络和浏览器支持情况；原始频道地址仅作为初始配置，不保证永久有效。

## Tesla 车机媒体控制

应用使用单个 `<audio>` 元素，并尝试注册 Media Session 的播放/暂停动作。iOS 及 Tesla 对网页音频媒体控制的转发存在系统差异，无法由网页代码保证所有车辆/系统版本均可控制。请先用 Safari 添加到主屏幕后实际测试。

## 图标说明

`apple-touch-icon.png` 为 180×180 PNG，供 iPhone 主屏幕图标使用；Web App Manifest 另提供 192×192 和 512×512 PNG，兼顾常见 PWA 图标要求。iOS 会自行处理圆角等显示效果，不要把圆角裁切直接画进图标。
