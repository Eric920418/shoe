/**
 * GraphQL Yoga 插件 - 查詢深度和複雜度限制
 */

import { Plugin } from 'graphql-yoga'

/**
 * 查詢深度限制插件
 * 防止過深的嵌套查詢導致性能问题
 */
export function createDepthLimitPlugin(maxDepth: number = 10): Plugin {
  return {
    onValidate({ params }) {
      // 計算查詢深度
      const depth = calculateQueryDepth(params.documentAST)

      if (depth > maxDepth) {
        throw new Error(`查詢深度超過限制 (${depth} > ${maxDepth})`)
      }
    },
  }
}

/**
 * 計算查詢深度
 */
function calculateQueryDepth(document: any, depth = 0): number {
  if (!document || !document.definitions) {
    return depth
  }

  let maxDepth = depth

  for (const definition of document.definitions) {
    if (definition.kind === 'OperationDefinition') {
      const selectionSetDepth = calculateSelectionSetDepth(
        definition.selectionSet,
        depth + 1
      )
      maxDepth = Math.max(maxDepth, selectionSetDepth)
    }
  }

  return maxDepth
}

/**
 * 計算選擇集深度
 */
function calculateSelectionSetDepth(selectionSet: any, depth: number): number {
  if (!selectionSet || !selectionSet.selections) {
    return depth
  }

  let maxDepth = depth

  for (const selection of selectionSet.selections) {
    if (selection.kind === 'Field' && selection.selectionSet) {
      const childDepth = calculateSelectionSetDepth(
        selection.selectionSet,
        depth + 1
      )
      maxDepth = Math.max(maxDepth, childDepth)
    } else if (selection.kind === 'InlineFragment' && selection.selectionSet) {
      const fragmentDepth = calculateSelectionSetDepth(
        selection.selectionSet,
        depth
      )
      maxDepth = Math.max(maxDepth, fragmentDepth)
    } else if (selection.kind === 'FragmentSpread') {
      // Fragment spreads 需要在驗證階段處理
      maxDepth = Math.max(maxDepth, depth + 1)
    }
  }

  return maxDepth
}

/**
 * 查詢複雜度限制插件
 * 防止複雜查詢消耗過多資源
 */
export function createComplexityLimitPlugin(maxComplexity: number = 1000): Plugin {
  return {
    onValidate({ params }) {
      // 計算查詢複雜度
      const complexity = calculateQueryComplexity(params.documentAST)

      if (complexity > maxComplexity) {
        throw new Error(`查詢複雜度超過限制 (${complexity} > ${maxComplexity})`)
      }
    },
  }
}

/**
 * 計算查詢複雜度
 * 簡單實現：每個字段 +1，陣列字段 +10
 */
function calculateQueryComplexity(document: any): number {
  if (!document || !document.definitions) {
    return 0
  }

  let totalComplexity = 0

  for (const definition of document.definitions) {
    if (definition.kind === 'OperationDefinition') {
      totalComplexity += calculateSelectionSetComplexity(definition.selectionSet)
    }
  }

  return totalComplexity
}

/**
 * 計算選擇集複雜度
 */
function calculateSelectionSetComplexity(selectionSet: any): number {
  if (!selectionSet || !selectionSet.selections) {
    return 0
  }

  let complexity = 0

  for (const selection of selectionSet.selections) {
    if (selection.kind === 'Field') {
      // 基礎字段複雜度为 1
      complexity += 1

      // 如果字段是列表類型，增加複雜度
      const fieldName = selection.name.value
      if (isListField(fieldName)) {
        complexity += 10
      }

      // 遞迴計算子字段
      if (selection.selectionSet) {
        complexity += calculateSelectionSetComplexity(selection.selectionSet)
      }
    } else if (selection.kind === 'InlineFragment' && selection.selectionSet) {
      complexity += calculateSelectionSetComplexity(selection.selectionSet)
    } else if (selection.kind === 'FragmentSpread') {
      complexity += 5 // Fragment spread 固定複雜度
    }
  }

  return complexity
}

/**
 * 判断是否为列表字段
 * 簡單實現：複數形式的字段名
 */
function isListField(fieldName: string): boolean {
  const listFields = [
    'products',
    'categories',
    'brands',
    'reviews',
    'orders',
    'items',
    'variants',
    'sizeCharts',
    'images',
    'features',
  ]
  return listFields.includes(fieldName) || fieldName.endsWith('s')
}

/**
 * 請求日誌插件
 */
export function createRequestLoggerPlugin(): Plugin {
  return {
    onRequest({ request, url }) {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] GraphQL Request: ${request.method} ${url.pathname}`)
    },
    onResponse({ response }) {
      if (response.status >= 400) {
        console.error(`[GraphQL Error] Status: ${response.status}`)
      }
    },
  }
}
