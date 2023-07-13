/**
 * @returns {((p: Promise<any>) => void) & { promises: Promise<unknown>[] }}
 */
export const mockWaitUntil = () => {
  const promises = []
  /** @param {Promise<any>} p */
  const waitUntil = p => { promises.push(p) }
  waitUntil.promises = promises
  return waitUntil
}

/**
 * @param {import('dagula').Block[]} blocks
 * @returns {import('dagula').Blockstore}
 */
export const mockBlockstore = blocks => ({
  get: async cid => blocks.find(b => b.cid.toString() === cid.toString())
})
