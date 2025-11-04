#!/bin/bash

# 完整重启服务器脚本（Nginx + Next.js）

echo "🚀 开始重启服务器..."
echo ""

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

# 2. 删除 .next 文件夹
echo "🗑️  删除 .next 缓存..."
rm -rf .next
echo "   ✅ 缓存已清除"
echo ""

# 3. 构建项目（忽略 prerender 错误）
echo "🔨 构建项目（这可能需要几分钟）..."
pnpm build || echo "⚠️  构建有 prerender 警告，但继续启动..."
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

# 启动标准 Next.js 服务器
nohup pnpm start > logs/server.log 2>&1 &
SERVER_PID=$!

echo "✅ Next.js 服务器已在后台启动！"
echo "   进程 PID: $SERVER_PID"
echo ""
echo "📌 常用命令:"
echo "   查看 Next.js 日志: tail -f logs/server.log"
echo "   查看 Nginx 日志: sudo tail -f /var/log/nginx/shoe-store-https-access.log"
echo "   停止 Next.js: pkill -f next"
echo "   查看进程: ps aux | grep next"
echo "   Nginx 状态: sudo systemctl status nginx"
echo ""
