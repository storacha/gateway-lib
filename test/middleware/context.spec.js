/* eslint-env browser */
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { mockWaitUntil } from '../helpers.js'
import { withContext } from '../../src/middleware.js'

describe('withContext', () => {
  it('should clone the context object', async () => {
    const waitUntil = mockWaitUntil()
    const ctx = { waitUntil }
    const env = { DEBUG: 'true' }
    const req = new Request('http://localhost/ipfs/bafybeifwq2ywuoziunhtoecesw65p4exisfiskcklujke4fwrpx7y6b2ke')

    const res = await withContext(async (req, env, context) => {
      assert.notStrictEqual(context, ctx)
      assert.equal(typeof context.waitUntil, 'function')
      return new Response()
    })(req, env, ctx)

    assert.strictEqual(res.status, 200)
  })
})
