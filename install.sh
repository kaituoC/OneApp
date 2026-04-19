#!/bin/bash

# OneApp 依赖安装脚本
# 使用淘宝镜像解决网络问题
# 使用方法：./install.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "  OneApp 依赖安装脚本"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 清理旧文件
echo "🧹 清理旧文件..."
if [ -d "node_modules" ]; then
  echo "   删除 node_modules..."
  rm -rf node_modules
fi
if [ -f "package-lock.json" ]; then
  echo "   删除 package-lock.json..."
  rm -f package-lock.json
fi
echo ""

# 创建 .npmrc 文件（淘宝镜像）
echo "⚙️  配置 npm 镜像源..."
cat > .npmrc << 'EOF'
registry=https://registry.npmmirror.com
EOF
echo "   ✓ 已设置淘宝镜像：https://registry.npmmirror.com"
echo ""

# 设置 Electron 镜像环境变量
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export npm_config_electron_mirror="https://npmmirror.com/mirrors/electron/"

echo "📦 开始安装依赖..."
echo "   npm registry: $(npm config get registry)"
echo "   electron mirror: $ELECTRON_MIRROR"
echo ""

# 最大重试次数
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  echo "----------------------------------------"
  echo "🔄 尝试安装 (第 $((RETRY_COUNT + 1))/$MAX_RETRIES 次)"
  echo "----------------------------------------"
  
  # 执行安装
  if npm install --prefer-offline --no-audit 2>&1; then
    echo ""
    echo -e "${GREEN}✅ 依赖安装成功！${NC}"
    echo ""
    
    # 验证 Electron 二进制文件
    echo "🔍 验证 Electron 安装..."
    if [ -d "node_modules/electron/dist" ]; then
      echo -e "${GREEN}   ✓ Electron 二进制文件已下载${NC}"
    else
      echo -e "${YELLOW}   ⚠ Electron 二进制文件未找到，单独安装...${NC}"
      
      # 单独安装 Electron
      rm -rf node_modules/electron
      if ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" npm install electron --save-dev 2>&1; then
        echo -e "${GREEN}   ✓ Electron 安装成功${NC}"
      else
        echo -e "${RED}   ✗ Electron 安装失败${NC}"
      fi
    fi
    
    echo ""
    echo "📊 安装完成信息:"
    echo "   node_modules 大小：$(du -sh node_modules | cut -f1)"
    echo "   包数量：$(ls node_modules | wc -l | tr -d ' ')"
    echo ""
    
    # 验证关键依赖
    echo "🔍 验证关键依赖..."
    if command -v npx &> /dev/null; then
      if npx electron-vite --version 2>/dev/null; then
        echo -e "${GREEN}   ✓ electron-vite 正常${NC}"
      fi
      if npx vite --version 2>/dev/null; then
        echo -e "${GREEN}   ✓ vite 正常${NC}"
      fi
    fi
    
    echo ""
    echo "========================================"
    echo -e "${GREEN}  安装完成！${NC}"
    echo "========================================"
    echo ""
    echo "🚀 下一步:"
    echo "   npm run dev     # 开发模式"
    echo "   npm run build   # 构建"
    echo "   npm run preview # 预览"
    echo ""
    
    exit 0
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo ""
    echo -e "${YELLOW}❌ 安装失败，10 秒后重试...${NC}"
    sleep 10
  fi
done

# 所有重试失败
echo ""
echo -e "${RED}========================================${NC}"
echo -e "${RED}  安装失败！${NC}"
echo -e "${RED}========================================${NC}"
echo ""
echo "❌ 已达到最大重试次数 $MAX_RETRIES"
echo ""
echo "💡 建议:"
echo "   1. 检查网络连接"
echo "   2. 手动清理后重试:"
echo "      rm -rf node_modules package-lock.json"
echo "      npm install"
echo ""
echo "   3. 检查 npm 配置:"
echo "      npm config get registry"
echo "      # 应该是：https://registry.npmmirror.com"
echo ""
echo "   4. 查看完整日志:"
echo "      cat ~/.npm/_logs/*.log | tail -100"
echo ""

exit 1
