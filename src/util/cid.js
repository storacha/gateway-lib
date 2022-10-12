import { CID } from 'multiformats/cid'

/** @param {string} str */
export function parseCid (str) {
  try {
    return CID.parse(str)
  } catch (err) {
    throw new Error('invalid CID', { cause: err })
  }
}

/** @param {string} str */
export const tryParseCid = str => { try { return CID.parse(str) } catch {} }
