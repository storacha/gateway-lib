export const mockWaitUntil = () => () => {}

/**
 * @param {import('dagula').Block[]} blocks
 * @returns {import('dagula').Blockstore}
 */
export const mockBlockstore = blocks => ({
  get: async cid => blocks.find(b => b.cid.toString() === cid.toString() )
})
