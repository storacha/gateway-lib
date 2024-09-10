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

describe('UnixFS file handler', async () => {
  const waitUntil = mockWaitUntil()
  const filename = 'Puzzle People #1.png'
  const path = `/${filename}`
  const searchParams = new URLSearchParams()
  const fileData = fromString('test')
  const fileBlock = await encode({ value: fileData, codec: raw, hasher })
  const pbData = pb.createNode(new UnixFS({ type: 'directory' }).marshal(), [{
    Name: filename,
    Hash: fileBlock.cid
  }])
  const dirBlock = await encode({ value: pbData, codec: pb, hasher })
  const blockstore = mockBlockstore([dirBlock, fileBlock])
  const dagula = new Dagula(blockstore)
  const ctx = { waitUntil, unixfs: dagula, dataCid: dirBlock.cid, path, searchParams }
  const env = { DEBUG: 'true' }

  it('absolute byte range request', async () => {
    const [first, last] = [1, 3]
    const req = new Request('http://localhost/ipfs/bafy', { headers: { range: `bytes=${first}-${last}` } })
    const res = await handleUnixfs(req, env, ctx)

    assert.equal(res.status, 206)
    assert.equal(res.headers.get('Content-Range'), `bytes ${first}-${last}/${fileData.length}`)
    const data = await res.text()
    assert.equal(data, 'est')
  })

  it('offset byte range request', async () => {
    const [first] = [1]
    const req = new Request('http://localhost/ipfs/bafy', { headers: { range: `bytes=${first}-` } })
    const res = await handleUnixfs(req, env, ctx)

    assert.equal(res.status, 206)
    assert.equal(res.headers.get('Content-Range'), `bytes ${first}-${fileData.length - 1}/${fileData.length}`)
    const data = await res.text()
    assert.equal(data, 'est')
  })

  it('suffix byte range request', async () => {
    const suffix = -3
    const req = new Request('http://localhost/ipfs/bafy', { headers: { range: `bytes=${suffix}` } })
    const res = await handleUnixfs(req, env, ctx)

    assert.equal(res.status, 206)
    assert.equal(res.headers.get('Content-Range'), `bytes ${fileData.length + suffix}-${fileData.length - 1}/${fileData.length}`)
    const data = await res.text()
    assert.equal(data, 'est')
  })
})
