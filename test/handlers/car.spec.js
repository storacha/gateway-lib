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
})
