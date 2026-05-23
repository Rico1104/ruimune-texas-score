# 睿mune 德州记分网页 Demo

移动端优先的德州买入记分 Demo，使用 React、TypeScript、Tailwind CSS 和 localStorage。

## 本地运行

```bash
npm install
npm run dev
```

## GitHub Pages 部署

本项目已包含 `.github/workflows/deploy.yml`。推送到 GitHub 仓库的 `main` 分支后，在仓库设置里启用 Pages：

1. 打开 GitHub 仓库的 `Settings`。
2. 进入 `Pages`。
3. `Build and deployment` 的 `Source` 选择 `GitHub Actions`。
4. 推送到 `main` 后等待 Actions 完成。

部署完成后会得到类似这样的在线地址：

```text
https://你的用户名.github.io/仓库名/
```

## 分享房间

当前 Demo 没有后端，房间数据不会跨设备实时同步。请在房间大厅点击“邀请好友”或“复制房号”，把生成的邀请链接发给朋友。朋友打开邀请链接后，再输入对应房号即可进入该房间快照。
