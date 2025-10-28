#!/bin/bash
# 测试脚本：检查TypeScript文件的导入和语法

echo "🔍 检查TypeScript文件语法..."
echo ""

FILES=(
  "app/api/graphql/route.ts"
  "app/products/[slug]/page.tsx"
  "app/products/[slug]/ProductDetailClient.tsx"
  "components/product/SizeSelector.tsx"
  "components/product/ColorSelector.tsx"
  "components/product/ProductGallery.tsx"
  "src/graphql/resolvers/index.ts"
  "src/lib/auth.ts"
  "src/lib/validation.ts"
  "src/lib/security.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ 找到: $file"
  else
    echo "❌ 缺失: $file"
  fi
done

echo ""
echo "📊 文件统计："
echo "TypeScript文件总数: $(find . -name "*.ts" -o -name "*.tsx" | wc -l)"
echo "组件文件: $(find components -name "*.tsx" 2>/dev/null | wc -l)"
echo "页面文件: $(find app -name "*.tsx" 2>/dev/null | wc -l)"

