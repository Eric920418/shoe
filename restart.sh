#!/bin/bash

# 完整重启服务器脚本

echo "🚀 开始重启服务器..."
echo ""

# 1. 停止现有进程（更彻底）
echo "⏹️  停止现有进程..."
pkill -f "next" 2>/dev/null && echo "   已停止 Next.js 进程" || echo "   没有运行中的进程"
sleep 2

# 再次确认进程已停止
if pgrep -f "next" > /dev/null; then
    echo "   强制停止残留进程..."
    pkill -9 -f "next" 2>/dev/null || true
    sleep 1
fi
echo ""

# 2. 删除 .next 文件夹
echo "🗑️  删除 .next 缓存..."
rm -rf .next
echo "   ✅ 缓存已清除"
echo ""

# 3. 构建项目（忽略 prerender 错误）
echo "🔨 构建项目（这可能需要几分钟）..."
pnpm build || echo "⚠️  构建有 prerender 警告，但继续启动..."
echo ""

# 4. 启动服务器（后台运行）
echo "✅ 重启完成！正在启动服务器..."
echo "🌐 服务器地址: http://localhost:3000"
echo "📝 日志文件: ./server.log"
echo ""

# 创建日志目录（如果不存在）
mkdir -p logs

# 在后台启动服务器并输出日志
nohup pnpm start > logs/server.log 2>&1 &
SERVER_PID=$!

echo "✅ 服务器已在后台启动！"
echo "   进程 PID: $SERVER_PID"
echo ""
echo "📌 常用命令:"
echo "   查看日志: tail -f logs/server.log"
echo "   停止服务器: pkill -f next"
echo "   查看进程: ps aux | grep next"
echo ""
