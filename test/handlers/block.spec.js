import { describe, it } from 'node:test'
import assert from 'node:assert'
import { Dagula } from 'dagula'
import { equals, fromString } from 'uint8arrays'
import { encode } from 'multiformats/block'
import * as raw from 'multiformats/codecs/raw'
import { sha256 as hasher } from 'multiformats/hashes/sha2'
import { handleBlock } from '../../src/handlers/block.js'
import { mockWaitUntil, mockBlockstore } from '../helpers.js'

describe('block handler', () => {
  it('serves a block', async () => {    
    const waitUntil = mockWaitUntil()
    const path = ''
    const searchParams = new URLSearchParams()
    const block = await encode({ value: fromString('test'), codec: raw, hasher })
    const blockstore = mockBlockstore([block])
    const dagula = new Dagula(blockstore)
    const ctx = { waitUntil, dagula, dataCid: block.cid, path, searchParams }
    const env = { DEBUG: 'true' }
    const req = new Request('http://localhost/ipfs/bafy')
    const res = await handleBlock(req, env, ctx)
    assert(equals(new Uint8Array(await res.arrayBuffer()), block.bytes))
  })
})
