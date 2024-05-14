/* eslint-env browser */
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { Dagula } from 'dagula'
import { fromString, toString } from 'uint8arrays'
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
    const ctx = { waitUntil, unixfs: dagula, blocks: dagula, dataCid: block.cid, path, searchParams }
    const env = { DEBUG: 'true' }
    const req = new Request('http://localhost/ipfs/bafy')
    const res = await handleBlock(req, env, ctx)
    assert.equal(await res.text(), toString(block.bytes))
  })

  it('serves block absolute byte range', async () => {
    const waitUntil = mockWaitUntil()
    const path = ''
    const searchParams = new URLSearchParams()
    const block = await encode({ value: fromString('testtest'), codec: raw, hasher })
    const blockstore = mockBlockstore([block])
    const dagula = new Dagula(blockstore)
    const ctx = { waitUntil, unixfs: dagula, blocks: dagula, dataCid: block.cid, path, searchParams }
    const env = { DEBUG: 'true' }
    const range = [3, 4] // "tt"
    const req = new Request('http://localhost/ipfs/bafy', {
      headers: { Range: `bytes=${range[0]}-${range[1]}` }
    })
    const res = await handleBlock(req, env, ctx)
    assert.equal(await res.text(), toString(block.bytes.slice(range[0], range[1] + 1)))
  })

  it('serves block positive suffix byte range', async () => {
    const waitUntil = mockWaitUntil()
    const path = ''
    const searchParams = new URLSearchParams()
    const block = await encode({ value: fromString('testtest'), codec: raw, hasher })
    const blockstore = mockBlockstore([block])
    const dagula = new Dagula(blockstore)
    const ctx = { waitUntil, unixfs: dagula, blocks: dagula, dataCid: block.cid, path, searchParams }
    const env = { DEBUG: 'true' }
    const range = [4] // "test"
    const req = new Request('http://localhost/ipfs/bafy', {
      headers: { Range: `bytes=${range[0]}-` }
    })
    const res = await handleBlock(req, env, ctx)
    assert.equal(await res.text(), toString(block.bytes.slice(range[0])))
  })

  it('serves block negative suffix byte range', async () => {
    const waitUntil = mockWaitUntil()
    const path = ''
    const searchParams = new URLSearchParams()
    const block = await encode({ value: fromString('testtest'), codec: raw, hasher })
    const blockstore = mockBlockstore([block])
    const dagula = new Dagula(blockstore)
    const ctx = { waitUntil, unixfs: dagula, blocks: dagula, dataCid: block.cid, path, searchParams }
    const env = { DEBUG: 'true' }
    const range = [-2] // "st"
    const req = new Request('http://localhost/ipfs/bafy', {
      headers: { Range: `bytes=${range[0]}` }
    })
    const res = await handleBlock(req, env, ctx)
    assert.equal(await res.text(), toString(block.bytes.slice(range[0])))
  })
})
