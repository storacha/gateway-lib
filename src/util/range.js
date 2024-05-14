import { parseRange } from '@httpland/range-parser'

/**
 * @param {string} [str]
 * @returns {import('dagula').Range[]}
 */
export const decodeRangeHeader = (str) => {
  if (!str) throw new Error('missing Range header value')
  /** @type {import('dagula').Range[]} */
  const ranges = []
  for (const r of parseRange(str).rangeSet) {
    if (typeof r === 'string') {
      // "other" - ignore
    } else if ('firstPos' in r) {
      ranges.push(r.lastPos != null ? [r.firstPos, r.lastPos] : [r.firstPos])
    } else {
      ranges.push([-r.suffixLength])
    }
  }
  return ranges
}

/**
 * Resolve a range to an absolute range.
 *
 * @param {import('dagula').Range} range
 * @param {number} totalSize
 * @returns {import('dagula').AbsoluteRange}
 */
export const resolveRange = ([first, last], totalSize) => [
  first < 0 ? totalSize + first : first,
  last ?? totalSize - 1
]
