/* eslint-env browser */
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { mockWaitUntil } from '../helpers.js'
import { withParsedIpfsUrl } from '../../src/middleware.js'

describe('withParsedIpfsUrl', () => {
  it('should decode URI components in path', async () => {
    const waitUntil = mockWaitUntil()
    const ctx = { waitUntil }
    const env = { DEBUG: 'true' }

    const filename = 'Screenshot 2022-10-21 at 17.32.00.png'
    const req = new Request(`http://localhost/ipfs/bafybeifwq2ywuoziunhtoecesw65p4exisfiskcklujke4fwrpx7y6b2ke/${encodeURIComponent(filename)}`)

    const res = await withParsedIpfsUrl((req, env, ctx) => {
      assert.strictEqual(ctx.path, `/${filename}`)
      return new Response()
    })(req, env, ctx)

    assert.strictEqual(res.status, 200)
  })
})
