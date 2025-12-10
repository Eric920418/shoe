/**
 * 尺碼換算工具函數
 * 根據腳長公分數自動計算 EU、US、UK 尺碼
 */

export type GenderType = 'MEN' | 'WOMEN' | 'KIDS'

// 完整尺碼對照表 - 用於精確換算
export const sizeConversionTable = {
  MEN: [
    { cm: 22.5, eu: '36', us: '4', uk: '3.5' },
    { cm: 23.0, eu: '37', us: '4.5', uk: '4' },
    { cm: 23.5, eu: '38', us: '5', uk: '4.5' },
    { cm: 24.0, eu: '38.5', us: '5.5', uk: '5' },
    { cm: 24.5, eu: '39', us: '6.5', uk: '6' },
    { cm: 25.0, eu: '40', us: '7', uk: '6.5' },
    { cm: 25.5, eu: '41', us: '8', uk: '7' },
    { cm: 26.0, eu: '42', us: '8.5', uk: '7.5' },
    { cm: 26.5, eu: '42.5', us: '9', uk: '8' },
    { cm: 27.0, eu: '43', us: '9.5', uk: '8.5' },
    { cm: 27.5, eu: '44', us: '10', uk: '9' },
    { cm: 28.0, eu: '44.5', us: '10.5', uk: '9.5' },
    { cm: 28.5, eu: '45', us: '11', uk: '10' },
    { cm: 29.0, eu: '46', us: '12', uk: '11' },
    { cm: 29.5, eu: '46.5', us: '12.5', uk: '11.5' },
    { cm: 30.0, eu: '47', us: '13', uk: '12' },
    { cm: 30.5, eu: '48', us: '14', uk: '13' },
    { cm: 31.0, eu: '49', us: '15', uk: '14' },
  ],
  WOMEN: [
    { cm: 21.0, eu: '34', us: '4', uk: '1.5' },
    { cm: 21.5, eu: '34.5', us: '4.5', uk: '2' },
    { cm: 22.0, eu: '35', us: '5', uk: '2.5' },
    { cm: 22.5, eu: '35.5', us: '5.5', uk: '3' },
    { cm: 23.0, eu: '36', us: '6', uk: '3.5' },
    { cm: 23.5, eu: '37', us: '6.5', uk: '4' },
    { cm: 24.0, eu: '38', us: '7', uk: '4.5' },
    { cm: 24.5, eu: '39', us: '8', uk: '5.5' },
    { cm: 25.0, eu: '39.5', us: '8.5', uk: '6' },
    { cm: 25.5, eu: '40', us: '9', uk: '6.5' },
    { cm: 26.0, eu: '41', us: '10', uk: '7.5' },
    { cm: 26.5, eu: '41.5', us: '10.5', uk: '8' },
    { cm: 27.0, eu: '42', us: '11', uk: '8.5' },
  ],
  KIDS: [
    { cm: 15.0, eu: '25', us: '8C', uk: '7' },
    { cm: 15.5, eu: '26', us: '9C', uk: '8' },
    { cm: 16.0, eu: '26.5', us: '9.5C', uk: '8.5' },
    { cm: 16.5, eu: '27', us: '10C', uk: '9' },
    { cm: 17.0, eu: '28', us: '11C', uk: '10' },
    { cm: 17.5, eu: '29', us: '11.5C', uk: '10.5' },
    { cm: 18.0, eu: '30', us: '12C', uk: '11' },
    { cm: 18.5, eu: '30.5', us: '12.5C', uk: '11.5' },
    { cm: 19.0, eu: '31', us: '13C', uk: '12' },
    { cm: 19.5, eu: '32', us: '1Y', uk: '13' },
    { cm: 20.0, eu: '33', us: '2Y', uk: '1' },
    { cm: 20.5, eu: '33.5', us: '2.5Y', uk: '1.5' },
    { cm: 21.0, eu: '34', us: '3Y', uk: '2' },
    { cm: 21.5, eu: '35', us: '3.5Y', uk: '2.5' },
    { cm: 22.0, eu: '36', us: '4Y', uk: '3' },
  ],
}

export interface SizeConversionResult {
  eu: string
  us: string
  uk: string
}

/**
 * 根據公分數自動換算尺碼
 * @param cmValue 公分數
 * @param gender 性別類型
 * @returns 換算結果 { eu, us, uk } 或 null
 */
export function convertSizeFromCm(cmValue: number, gender: GenderType): SizeConversionResult | null {
  const table = sizeConversionTable[gender]
  if (!table || table.length === 0) return null

  // 找到最接近的尺碼
  let closest = table[0]
  let minDiff = Math.abs(cmValue - closest.cm)

  for (const size of table) {
    const diff = Math.abs(cmValue - size.cm)
    if (diff < minDiff) {
      minDiff = diff
      closest = size
    }
  }

  // 如果差距太大（超過 1cm），使用公式計算近似值
  if (minDiff > 1) {
    // 使用通用換算公式（近似值）
    const eu = Math.round((cmValue * 1.5 + 2) * 2) / 2 // EU 尺碼
    let us: number
    let uk: number

    if (gender === 'WOMEN') {
      us = Math.round((cmValue - 21) * 2) / 2 + 5
      uk = Math.round((cmValue - 21.5) * 2) / 2 + 2.5
    } else if (gender === 'KIDS') {
      us = Math.round((cmValue - 9.5) * 2) / 2
      uk = Math.round((cmValue - 10) * 2) / 2
    } else {
      // MEN
      us = Math.round((cmValue - 18) * 2) / 2
      uk = Math.round((cmValue - 18.5) * 2) / 2
    }

    return {
      eu: eu.toString(),
      us: us > 0 ? us.toString() : '1',
      uk: uk > 0 ? uk.toString() : '1',
    }
  }

  return {
    eu: closest.eu,
    us: closest.us,
    uk: closest.uk,
  }
}

/**
 * 獲取指定性別的可用尺碼範圍
 * @param gender 性別類型
 * @returns 尺碼對照表陣列
 */
export function getSizeTable(gender: GenderType) {
  return sizeConversionTable[gender] || []
}

/**
 * 根據 EU 尺碼查找完整尺碼資訊
 * @param eu 歐碼
 * @param gender 性別類型
 * @returns 完整尺碼資訊或 null
 */
export function findSizeByEu(eu: string, gender: GenderType) {
  const table = sizeConversionTable[gender]
  return table?.find((size) => size.eu === eu) || null
}
