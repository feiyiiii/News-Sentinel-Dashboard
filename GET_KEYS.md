# 获取 Gold / Silver 和 X 的最简步骤

## 1. 获取 Alpha Vantage Key

用途：给 Gold / Silver 实时价格使用。

步骤：

1. 打开：https://www.alphavantage.co/support/#api-key
2. 填邮箱并提交
3. 复制网站给你的 API Key
4. 双击桌面的 `News Sentinel Setup.command`
5. 把这个 Key 粘贴到 `ALPHA_VANTAGE_API_KEY`

## 2. 获取 X Bearer Token

用途：给 X 新闻扫描使用。

步骤：

1. 打开：https://developer.x.com/
2. 登录你的 X 账号
3. 申请开发者账号
4. 创建 Project 和 App
5. 在 App 的 `Keys and tokens` 页面找到 `Bearer Token`
6. 复制 Bearer Token
7. 双击桌面的 `News Sentinel Setup.command`
8. 把这个 Token 粘贴到 `X_BEARER_TOKEN`

## 3. 完成后怎么查看

1. 双击桌面的 `News Sentinel.command`
2. 稍等几秒
3. 浏览器会自动打开本地仪表盘

## 4. 如果还是没有数据

- Gold / Silver 没有数据：通常是 `ALPHA_VANTAGE_API_KEY` 没填对
- X 没有数据：通常是 `X_BEARER_TOKEN` 没填对，或者 X 开发者权限还没开通
