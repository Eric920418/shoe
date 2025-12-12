#!/bin/bash

# 完整重启服务器脚本（Nginx + Next.js）
# 包含記憶體優化配置

echo "🚀 开始重启服务器..."
echo ""

# ==================== 記憶體優化設定 ====================
# Node.js 記憶體限制（MB）
NODE_MEMORY_LIMIT=1024

# 檢查 Swap 空間
check_swap() {
    SWAP_SIZE=$(free -m | awk '/^Swap:/ {print $2}')
    if [ "$SWAP_SIZE" -lt 1000 ]; then
        echo "⚠️  警告: Swap 空間不足 (${SWAP_SIZE}MB)"
        echo "   建議執行以下命令增加 Swap:"
        echo "   sudo fallocate -l 4G /swapfile"
        echo "   sudo chmod 600 /swapfile"
        echo "   sudo mkswap /swapfile"
        echo "   sudo swapon /swapfile"
        echo "   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab"
        echo ""
    else
        echo "✅ Swap 空間: ${SWAP_SIZE}MB"
    fi
}

# 顯示當前記憶體狀態
show_memory_status() {
    echo "📊 記憶體狀態:"
    free -h | head -2
    echo ""
}

# 清理系統快取（可選，需要 root）
cleanup_memory() {
    if [ "$1" = "--clean-cache" ]; then
        echo "🧹 清理系統快取..."
        sudo sh -c 'echo 3 > /proc/sys/vm/drop_caches' 2>/dev/null && \
            echo "   ✅ 系統快取已清理" || \
            echo "   ⚠️  無法清理系統快取（需要 sudo 權限）"
    fi
}

# ==================== 開始執行 ====================

# 顯示記憶體狀態
show_memory_status
check_swap

# 1. 停止现有进程（更彻底）
echo "⏹️  停止现有进程..."
pkill -f "next" 2>/dev/null && echo "   已停止 Next.js 进程" || true
pkill -f "server.mjs" 2>/dev/null && echo "   已停止自定义服务器" || true
sleep 2

# 再次确认进程已停止
if pgrep -f "next\|server.mjs" > /dev/null; then
    echo "   强制停止残留进程..."
    pkill -9 -f "next" 2>/dev/null || true
    pkill -9 -f "server.mjs" 2>/dev/null || true
    sleep 1
fi
echo ""

# 釋放記憶體（如果有參數）
cleanup_memory "$1"

# 2. 删除 .next 文件夹
echo "🗑️  删除 .next 缓存..."
rm -rf .next
echo "   ✅ 缓存已清除"
echo ""

# 3. 构建项目（使用記憶體限制）
echo "🔨 构建项目（記憶體限制: ${NODE_MEMORY_LIMIT}MB）..."
echo "   這可能需要幾分鐘，請耐心等待..."
NODE_OPTIONS="--max-old-space-size=${NODE_MEMORY_LIMIT}" pnpm build || {
    echo "⚠️  構建失敗或有警告"
    echo "   如果是記憶體不足，請嘗試:"
    echo "   1. 增加 Swap 空間"
    echo "   2. 執行: ./restart.sh --clean-cache"
    echo "   繼續嘗試啟動..."
}
echo ""

# 4. 重启 Nginx（重新加载配置）
echo "🔄 重启 Nginx..."
sudo systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "   ✅ Nginx 已重启"
else
    echo "   ⚠️  Nginx 重启失败，请检查配置"
fi
echo ""

# 5. 启动 Next.js 服务器（后台运行）
echo "✅ 构建完成！正在启动服务器..."

# 创建日志目录（如果不存在）
mkdir -p logs

echo "🌐 Next.js 运行在: http://localhost:3000"
echo "🔐 公开访问地址: https://xn--cjzl80byf571b.tw"
echo "   (Nginx 反向代理 + HTTPS)"
echo "📝 日志文件: ./logs/server.log"
echo ""

# 启动标准 Next.js 服务器（也加上記憶體限制）
NODE_OPTIONS="--max-old-space-size=${NODE_MEMORY_LIMIT}" nohup pnpm start > logs/server.log 2>&1 &
SERVER_PID=$!

echo "✅ Next.js 服务器已在后台启动！"
echo "   进程 PID: $SERVER_PID"
echo "   記憶體限制: ${NODE_MEMORY_LIMIT}MB"
echo ""
echo "📌 常用命令:"
echo "   查看 Next.js 日志: tail -f logs/server.log"
echo "   查看 Nginx 日志: sudo tail -f /var/log/nginx/shoe-store-https-access.log"
echo "   停止 Next.js: pkill -f next"
echo "   查看进程: ps aux | grep next"
echo "   Nginx 状态: sudo systemctl status nginx"
echo ""
echo "📌 記憶體優化選項:"
echo "   清理快取後重啟: ./restart.sh --clean-cache"
echo "   查看記憶體狀態: free -h"
echo "   查看 Swap 狀態: swapon --show"
echo ""
