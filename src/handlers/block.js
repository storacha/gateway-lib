/* eslint-env browser */
/**
 * @import { Block } from 'dagula'
 * @import { BlockDecoder } from 'multiformats'
 * @import { IpfsUrlContext, BlockContext, UnixfsContext, TimeoutController } from '../bindings.js'
 */
import * as dagJSON from '@ipld/dag-json'
import * as dagCBOR from '@ipld/dag-cbor'
import './templates/bundle.cjs'
import { MultipartByteRange } from 'multipart-byte-range'
import { hexdump } from '@gct256/hexdump'
import { CID } from 'multiformats/cid'
import { decodeRangeHeader, resolveRange } from '../util/range.js'
import { HttpError } from '../util/errors.js'
import { getTemplate, registerHelper } from '../util/handlebars.js'

/**
 * @typedef {IpfsUrlContext & BlockContext & UnixfsContext & { timeoutController?: TimeoutController }} BlockHandlerContext
 * @typedef {IpfsUrlContext & { gatewayDomain?: string, block: Block }} BlockHtmlHandlerContext
 */

/** @type {import('../bindings.js').Handler<BlockHandlerContext>} */
export async function handleBlock (request, env, ctx) {
  const { dataCid, path, timeoutController: controller, blocks, unixfs, searchParams } = ctx
  if (!dataCid) throw new Error('missing IPFS path')
  if (path == null) throw new Error('missing URL path')
  if (!blocks) throw new Error('missing block service')
  if (!unixfs) throw new Error('missing unixfs service')
  if (!searchParams) throw new Error('missing search params')

  /** @type {import('multiformats').CID} */
  let cid
  if (path && path !== '/') {
    // TODO: resolve path before calling handler
    const entry = await unixfs.getUnixfs(`${dataCid}${path}`, { signal: controller?.signal })
    cid = entry.cid
  } else {
    cid = dataCid
  }

  const etag = `"${cid}.raw"`
  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304 })
  }

  if (request.method === 'HEAD') {
    const stat = await blocks.statBlock(cid, { signal: controller?.signal })
    return new Response(undefined, {
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': stat.size.toString(),
        Etag: etag,
        Vary: 'Accept, Range'
      }
    })
  }
  if (request.method !== 'GET') {
    throw new HttpError('method not allowed', { status: 405 })
  }

  /** @type {import('multipart-byte-range').Range[]} */
  let ranges = []
  if (request.headers.has('range')) {
    try {
      ranges = decodeRangeHeader(request.headers.get('range') ?? '')
    } catch (err) {
      throw new HttpError('invalid range', { cause: err, status: 400 })
    }
  }

  const name = searchParams.get('filename') || `${cid}.bin`
  const utf8Name = encodeURIComponent(name)
  // eslint-disable-next-line no-control-regex
  const asciiName = encodeURIComponent(name.replace(/[^\x00-\x7F]/g, '_'))

  const headers = {
    'X-Content-Type-Options': 'nosniff',
    Etag: etag,
    'Cache-Control': 'public, max-age=29030400, immutable',
    'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`,
    Vary: 'Accept, Range'
  }

  if (ranges.length > 1) {
    return handleMultipartRange(blocks, cid, ranges, { signal: controller?.signal, headers })
  } else if (ranges.length === 1) {
    return handleRange(blocks, cid, ranges[0], { signal: controller?.signal, headers })
  }

  // no range is effectively Range: bytes=0-
  return handleRange(blocks, cid, [0], { signal: controller?.signal, headers })
}

/**
 * @param {import('dagula').BlockService} blocks
 * @param {import('multiformats').UnknownLink} cid
 * @param {import('dagula').Range} range
 * @param {{ signal?: AbortSignal, headers?: Record<string, string> }} [options]
 */
const handleRange = async (blocks, cid, range, options) => {
  const stat = await blocks.statBlock(cid, { signal: options?.signal })
  const [first, last] = resolveRange(range, stat.size)
  const contentLength = last - first + 1

  /** @type {Record<string, string>} */
  const headers = {
    ...options?.headers,
    'Content-Type': 'application/vnd.ipld.raw',
    'Content-Length': String(contentLength)
  }

  if (stat.size !== contentLength) {
    const contentRange = `bytes ${first}-${last}/${stat.size}`
    headers['Content-Range'] = contentRange
  }

  const status = stat.size === contentLength ? 200 : 206
  const content = await blocks.streamBlock(cid, { range, signal: options?.signal })
  return new Response(content, { status, headers })
}

/**
 * @param {import('dagula').BlockService} blocks
 * @param {import('multiformats').UnknownLink} cid
 * @param {import('dagula').Range[]} ranges
 * @param {{ signal?: AbortSignal, headers?: Record<string, string> }} [options]
 */
const handleMultipartRange = async (blocks, cid, ranges, options) => {
  const stat = await blocks.statBlock(cid, { signal: options?.signal })

  /** @param {import('dagula').AbsoluteRange} range */
  const getBytes = range => blocks.streamBlock(cid, { signal: options?.signal, range })

  const source = new MultipartByteRange(ranges, getBytes, {
    totalSize: stat.size,
    contentType: 'application/vnd.ipld.raw'
  })
  return new Response(source, { status: 206, headers: { ...options?.headers, ...source.headers } })
}

/** @type {Record<number, BlockDecoder<number, unknown>>} */
const codecs = {
  [dagCBOR.code]: dagCBOR,
  [dagJSON.code]: dagJSON
}

/** @type {Record<number, string>} */
const codecNames = {
  [dagCBOR.code]: 'dag-cbor',
  [dagJSON.code]: 'dag-json'
}

/** @param {unknown} obj */
const isIpldScalar = obj => {
  switch (typeof obj) {
    case 'string':
      return true
    case 'boolean':
      return true
    case 'number':
      return true
    case 'object': {
      if (obj == null) {
        return true
      }
      if (obj instanceof Uint8Array) { // IPLD bytes
        return true
      }
      if (obj instanceof CID) {
        return true
      }
      break
    }
  }
  return false
}
registerHelper('isIpldScalar', isIpldScalar)

/** @param {unknown} obj */
const isIpldList = obj => Array.isArray(obj)
registerHelper('isIpldList', isIpldList)

/** @param {unknown} obj */
const isIpldLink = obj => obj instanceof CID
registerHelper('isIpldLink', isIpldLink)

/** @param {unknown} obj */
const isIpldMap = obj => {
  return obj != null && typeof obj === 'object' && !isIpldScalar(obj) && !isIpldList(obj)
}
registerHelper('isIpldMap', isIpldMap)

/** @param {unknown} obj */
const isIpldBytes = obj => obj instanceof Uint8Array
registerHelper('isIpldBytes', isIpldBytes)

registerHelper('formatIpldScalar', (/** @type {unknown} */ obj) => {
  switch (typeof obj) {
    case 'string':
      return obj
    case 'boolean':
      return obj ? 'true' : 'false'
    case 'number':
      return obj.toString()
    case 'object': {
      if (obj == null) {
        return 'NULL'
      }
      if (obj instanceof Uint8Array) {
        return hexdump(obj).join('\n')
      }
      break
    }
  }
  return 'UNKNOWN'
})

/** @type {import('../bindings.js').Handler<BlockHtmlHandlerContext>} */
export async function handleBlockHtml (request, env, ctx) {
  const { dataCid, path, block } = ctx
  if (!dataCid) throw new Error('missing data CID')
  if (path == null) throw new Error('missing URL pathname')
  if (!block) throw new Error('missing block')

  const codec = codecs[block.cid.code]
  if (!codec) {
    throw new HttpError('unsupported entry type', { status: 501 })
  }

  const headers = {
    'Content-Type': 'text/html'
  }

  if (request.method === 'HEAD') {
    return new Response(null, { headers })
  }
  if (request.method !== 'GET') {
    throw new HttpError('method not allowed', { status: 405 })
  }

  const isSubdomain = new URL(request.url).hostname.includes('.ipfs.')
  const html = getTemplate('block')({
    gatewayDomain: ctx.gatewayDomain || 'storacha.link',
    path: isSubdomain ? ctx.path : `${ctx.dataCid}/${ctx.path}`,
    cid: block.cid,
    codecName: codecNames[block.cid.code] ?? 'UNKNOWN',
    codecHex: `0x${block.cid.code.toString(16)}`,
    value: codec.decode(block.bytes)
  })

  return new Response(html, { headers })
}
