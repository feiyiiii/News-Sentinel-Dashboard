#!/bin/zsh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "Running News Sentinel Bot..."
node src/index.js

if [ -f "$SCRIPT_DIR/output/dashboard.html" ]; then
  open "$SCRIPT_DIR/output/dashboard.html"
elif [ -f "$SCRIPT_DIR/output/latest-report.md" ]; then
  open "$SCRIPT_DIR/output/latest-report.md"
fi

echo ""
echo "Done. If a browser page opened, that is your local dashboard."
read -k 1 "?Press any key to close this window..."
