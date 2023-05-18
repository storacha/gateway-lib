/* eslint-env browser */
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { Dagula } from 'dagula'
import { fromString } from 'uint8arrays'
import { encode } from 'multiformats/block'
import * as raw from 'multiformats/codecs/raw'
import * as cbor from '@ipld/dag-cbor'
import { sha256 as hasher } from 'multiformats/hashes/sha2'
import { CarReader } from '@ipld/car'
import { handleCar } from '../../src/handlers/car.js'
import { mockWaitUntil, mockBlockstore } from '../helpers.js'

describe('CAR handler', () => {
  it('serves a CAR', async () => {
    const waitUntil = mockWaitUntil()
    const path = ''
    const searchParams = new URLSearchParams()
    const leafBlock = await encode({ value: fromString('test'), codec: raw, hasher })
    const rootBlock = await encode({ value: { leaf: leafBlock.cid }, codec: cbor, hasher })
    const blockstore = mockBlockstore([leafBlock, rootBlock])
    const dagula = new Dagula(blockstore)
    const ctx = { waitUntil, dagula, dataCid: rootBlock.cid, path, searchParams }
    const env = { DEBUG: 'true' }
    const req = new Request(`http://localhost/ipfs/${rootBlock.cid}`)
    const res = await handleCar(req, env, ctx)
    const reader = await CarReader.fromBytes(new Uint8Array(await res.arrayBuffer()))
    const roots = await reader.getRoots()
    assert.strictEqual(roots[0].toString(), rootBlock.cid.toString())
    assert(await reader.get(leafBlock.cid))
    assert(await reader.get(rootBlock.cid))
  })

  it('serves a CAR with query parameter dag-scope=block', async () => {
    const waitUntil = mockWaitUntil()
    const leafBlock0 = await encode({ value: fromString('test0'), codec: raw, hasher })
    const leafBlock1 = await encode({ value: fromString('test1'), codec: raw, hasher })
    const rootBlock = await encode({ value: { leaf0: leafBlock0.cid, leaf1: leafBlock1.cid }, codec: cbor, hasher })
    const blockstore = mockBlockstore([leafBlock0, leafBlock1, rootBlock])
    const dagula = new Dagula(blockstore)
    const url = new URL(`http://localhost/ipfs/${rootBlock.cid}/leaf0?dag-scope=block`)
    const path = url.pathname.replace(`/ipfs/${rootBlock.cid}`, '')
    const ctx = { waitUntil, dagula, dataCid: rootBlock.cid, path, searchParams: url.searchParams }
    const env = { DEBUG: 'true' }
    const req = new Request(url)
    const res = await handleCar(req, env, ctx)
    const reader = await CarReader.fromBytes(new Uint8Array(await res.arrayBuffer()))
    const roots = await reader.getRoots()
    assert.strictEqual(roots[0].toString(), rootBlock.cid.toString())
    assert(await reader.get(leafBlock0.cid))
    assert(await reader.get(rootBlock.cid))
    assert(!(await reader.has(leafBlock1.cid)))
  })

  it('serves a CAR with accept parameter order=dfs', async () => {
    const waitUntil = mockWaitUntil()

    const leafBlock0 = await encode({ value: fromString('test0'), codec: raw, hasher })
    const leafBlock1 = await encode({ value: fromString('test1'), codec: raw, hasher })
    const branchBlock0 = await encode({ value: { leaf: leafBlock0.cid }, codec: cbor, hasher })
    const branchBlock1 = await encode({ value: { leaf: leafBlock1.cid }, codec: cbor, hasher })
    const rootBlock = await encode({ value: [branchBlock0.cid, branchBlock1.cid], codec: cbor, hasher })
    const blockstore = mockBlockstore([leafBlock0, leafBlock1, branchBlock0, branchBlock1, rootBlock])
    const dagula = new Dagula(blockstore)
    const url = new URL(`http://localhost/ipfs/${rootBlock.cid}`)
    const path = url.pathname.replace(`/ipfs/${rootBlock.cid}`, '')
    const ctx = { waitUntil, dagula, dataCid: rootBlock.cid, path, searchParams: url.searchParams }
    const env = { DEBUG: 'true' }
    const req = new Request(url, {
      headers: {
        Accept: 'application/vnd.ipld.car; order=dfs'
      }
    })
    const res = await handleCar(req, env, ctx)
    const reader = await CarReader.fromBytes(new Uint8Array(await res.arrayBuffer()))
    const roots = await reader.getRoots()
    assert.strictEqual(roots[0].toString(), rootBlock.cid.toString())

    const blocks = []
    for await (const b of reader.blocks()) {
      blocks.push(b)
    }
    assert.strictEqual(blocks[0].cid.toString(), rootBlock.cid.toString())
    assert.strictEqual(blocks[1].cid.toString(), branchBlock0.cid.toString())
    assert.strictEqual(blocks[2].cid.toString(), leafBlock0.cid.toString())
    assert.strictEqual(blocks[3].cid.toString(), branchBlock1.cid.toString())
    assert.strictEqual(blocks[4].cid.toString(), leafBlock1.cid.toString())
  })

  // unk = unknown, so could change...we're just asserting here that we get a
  // different ordering from dfs, which tells us that our accept param is being
  // successfully passed to the library.
  //
  // Note: unk is technically also dfs, so this test could become invalid in
  // the future.
  it('serves a CAR with accept parameter order=unk', async () => {
    const waitUntil = mockWaitUntil()

    const leafBlock0 = await encode({ value: fromString('test0'), codec: raw, hasher })
    const leafBlock1 = await encode({ value: fromString('test1'), codec: raw, hasher })
    const branchBlock0 = await encode({ value: { leaf: leafBlock0.cid }, codec: cbor, hasher })
    const branchBlock1 = await encode({ value: { leaf: leafBlock1.cid }, codec: cbor, hasher })
    const rootBlock = await encode({ value: [branchBlock0.cid, branchBlock1.cid], codec: cbor, hasher })
    const blockstore = mockBlockstore([leafBlock0, leafBlock1, branchBlock0, branchBlock1, rootBlock])
    const dagula = new Dagula(blockstore)
    const url = new URL(`http://localhost/ipfs/${rootBlock.cid}`)
    const path = url.pathname.replace(`/ipfs/${rootBlock.cid}`, '')
    const ctx = { waitUntil, dagula, dataCid: rootBlock.cid, path, searchParams: url.searchParams }
    const env = { DEBUG: 'true' }
    const req = new Request(url, {
      headers: {
        Accept: 'application/vnd.ipld.car; order=unk'
      }
    })
    const res = await handleCar(req, env, ctx)
    const reader = await CarReader.fromBytes(new Uint8Array(await res.arrayBuffer()))
    const roots = await reader.getRoots()
    assert.strictEqual(roots[0].toString(), rootBlock.cid.toString())

    const blocks = []
    for await (const b of reader.blocks()) {
      blocks.push(b)
    }
    assert.notDeepEqual(
      // dfs order
      [
        rootBlock.cid.toString(),
        branchBlock0.cid.toString(),
        leafBlock0.cid.toString(),
        branchBlock1.cid.toString(),
        leafBlock1.cid.toString()
      ],
      // unk order
      blocks.map(b => b.cid.toString())
    )
  })
})
