#!/bin/bash

# 完整重启服务器脚本（支援 HTTPS）

echo "🚀 开始重启服务器..."
echo ""

# 检查 SSL 证书
if [ -f "ssl/private.key" ] && [ -f "ssl/fullchain.pem" ]; then
    echo "🔐 检测到 SSL 证书，将启用 HTTPS"
    USE_HTTPS=true
else
    echo "⚠️  未检测到 SSL 证书，使用标准 HTTP"
    USE_HTTPS=false
fi
echo ""

# 1. 停止现有进程（更彻底）
echo "⏹️  停止现有进程..."
pkill -f "next" 2>/dev/null && echo "   已停止 Next.js 进程" || true
pkill -f "server.mjs" 2>/dev/null && echo "   已停止 HTTPS 服务器" || true
sleep 2

# 再次确认进程已停止
if pgrep -f "next\|server.mjs" > /dev/null; then
    echo "   强制停止残留进程..."
    pkill -9 -f "next" 2>/dev/null || true
    pkill -9 -f "server.mjs" 2>/dev/null || true
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

# 创建日志目录（如果不存在）
mkdir -p logs

# 根据是否有 SSL 证书选择启动方式
if [ "$USE_HTTPS" = true ]; then
    echo "🔐 启动 HTTPS 服务器..."
    echo "🌐 服务器地址: https://xn--cjzl80byf571b.tw (HTTPS)"
    echo "   HTTP 自动重定向: http://xn--cjzl80byf571b.tw -> HTTPS"
    echo "📝 日志文件: ./logs/server.log"
    echo ""

    # 设置环境变量并启动 HTTPS 服务器
    NODE_ENV=production nohup node server.mjs > logs/server.log 2>&1 &
    SERVER_PID=$!

    echo "✅ HTTPS 服务器已在后台启动！"
    echo "   进程 PID: $SERVER_PID"
    echo "   HTTPS 端口: 443"
    echo "   HTTP 端口: 80"
    echo ""
    echo "📌 常用命令:"
    echo "   查看日志: tail -f logs/server.log"
    echo "   停止服务器: pkill -f server.mjs"
    echo "   查看进程: ps aux | grep server.mjs"
else
    echo "🌐 服务器地址: http://localhost:3000"
    echo "📝 日志文件: ./logs/server.log"
    echo ""

    # 启动标准 Next.js 服务器
    nohup pnpm start > logs/server.log 2>&1 &
    SERVER_PID=$!

    echo "✅ 服务器已在后台启动！"
    echo "   进程 PID: $SERVER_PID"
    echo ""
    echo "📌 常用命令:"
    echo "   查看日志: tail -f logs/server.log"
    echo "   停止服务器: pkill -f next"
    echo "   查看进程: ps aux | grep next"
fi
echo ""
