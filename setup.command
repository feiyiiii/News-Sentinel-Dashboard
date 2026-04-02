#!/bin/zsh
PROJECT_DIR='/Users/feiyi/Documents/New project/news-sentinel-bot'
ENV_FILE="$PROJECT_DIR/.env"

mkdir -p "$PROJECT_DIR"

if [ ! -f "$ENV_FILE" ]; then
  cp "$PROJECT_DIR/.env.example" "$ENV_FILE"
fi

echo "News Sentinel 配置向导"
echo ""
echo "这个向导会帮你填写："
echo "1. Alpha Vantage API Key（用于 Gold / Silver）"
echo "2. X Bearer Token（用于 X 新闻）"
echo ""
echo "如果你暂时没有其中某一个，可以直接按回车跳过，之后再运行一次这个向导。"
echo ""

current_alpha=$(grep '^ALPHA_VANTAGE_API_KEY=' "$ENV_FILE" | sed 's/^ALPHA_VANTAGE_API_KEY=//')
current_x=$(grep '^X_BEARER_TOKEN=' "$ENV_FILE" | sed 's/^X_BEARER_TOKEN=//')

if [ -n "$current_alpha" ]; then
  echo "当前已存在 Alpha Vantage Key。"
fi
if [ -n "$current_x" ]; then
  echo "当前已存在 X Bearer Token。"
fi

echo ""
read "alpha_key?请输入 ALPHA_VANTAGE_API_KEY（直接回车表示不修改）: "
read "x_token?请输入 X_BEARER_TOKEN（直接回车表示不修改）: "

if [ -n "$alpha_key" ]; then
  if grep -q '^ALPHA_VANTAGE_API_KEY=' "$ENV_FILE"; then
    sed -i '' "s|^ALPHA_VANTAGE_API_KEY=.*|ALPHA_VANTAGE_API_KEY=$alpha_key|" "$ENV_FILE"
  else
    echo "ALPHA_VANTAGE_API_KEY=$alpha_key" >> "$ENV_FILE"
  fi
fi

if [ -n "$x_token" ]; then
  if grep -q '^X_BEARER_TOKEN=' "$ENV_FILE"; then
    sed -i '' "s|^X_BEARER_TOKEN=.*|X_BEARER_TOKEN=$x_token|" "$ENV_FILE"
  else
    echo "X_BEARER_TOKEN=$x_token" >> "$ENV_FILE"
  fi
fi

echo ""
echo "配置完成。"
echo "配置文件位置：$ENV_FILE"
echo ""
echo "下一步："
echo "1. 关闭这个窗口"
echo "2. 双击桌面的 News Sentinel.command"
echo "3. 查看本地仪表盘是否出现 Gold / Silver 和 X 数据"
echo ""
read -k 1 "?按任意键关闭窗口..."
