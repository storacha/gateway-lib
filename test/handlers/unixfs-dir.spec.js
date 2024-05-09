/* eslint-env browser */
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { Dagula } from 'dagula'
import { fromString } from 'uint8arrays'
import { encode } from 'multiformats/block'
import * as raw from 'multiformats/codecs/raw'
import * as pb from '@ipld/dag-pb'
import { sha256 as hasher } from 'multiformats/hashes/sha2'
import { UnixFS } from 'ipfs-unixfs'
import { handleUnixfs } from '../../src/handlers/unixfs.js'
import { mockWaitUntil, mockBlockstore } from '../helpers.js'

describe('UnixFS handler', () => {
  it('directory correctly links to files whose name includes a #', async () => {
    const waitUntil = mockWaitUntil()
    const path = ''
    const searchParams = new URLSearchParams()
    const fileBlock = await encode({ value: fromString('test'), codec: raw, hasher })
    const pbData = pb.createNode(new UnixFS({ type: 'directory' }).marshal(), [{
      Name: 'Puzzle People #1.png',
      Hash: fileBlock.cid
    }])
    const dirBlock = await encode({ value: pbData, codec: pb, hasher })
    const blockstore = mockBlockstore([dirBlock, fileBlock])
    const dagula = new Dagula(blockstore)
    const ctx = { waitUntil, unixfs: dagula, dataCid: dirBlock.cid, path, searchParams }
    const env = { DEBUG: 'true' }
    const req = new Request('http://localhost/ipfs/bafy')
    const res = await handleUnixfs(req, env, ctx)
    const html = await res.text()
    assert(html.includes('Puzzle%20People%20%231.png'))
  })
})
