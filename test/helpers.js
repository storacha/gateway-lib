import { resolveRange } from '../src/util/range.js'

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
  async get (cid) {
    return blocks.find(b => b.cid.toString() === cid.toString())
  },
  async stream (cid, options) {
    const block = await this.get(cid)
    if (!block) return
    return new ReadableStream({
      pull (controller) {
        const range = resolveRange(options?.range ?? [0], block.bytes.length)
        const bytes = block.bytes.slice(range[0], range[1] + 1)
        controller.enqueue(bytes)
        controller.close()
      }
    })
  },
  async stat (cid) {
    const block = await this.get(cid)
    if (!block) return
    return { size: block.bytes.length }
  }
})
