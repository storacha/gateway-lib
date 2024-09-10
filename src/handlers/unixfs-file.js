/* eslint-env browser */
import { toReadableStream } from '../util/streams.js'
import { detectContentType } from '../util/mime.js'
import { HttpError } from '../util/errors.js'
import { decodeRangeHeader, resolveRange } from '../util/range.js'

/**
 * @typedef {import('../bindings.js').UnixfsEntryContext} UnixfsFileHandlerContext
 */

/** @type {import('../bindings.js').Handler<UnixfsFileHandlerContext>} */
export async function handleUnixfsFile (request, env, ctx) {
  const { unixfsEntry: entry } = ctx
  if (!entry) throw new Error('missing UnixFS entry')
  if (entry.type !== 'file' && entry.type !== 'raw' && entry.type !== 'identity') {
    throw new Error('non UnixFS file entry')
  }

  const etag = `"${entry.cid}"`
  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304 })
  }

  /** @type {Record<string, string>} */
  const headers = {
    Etag: etag,
    'Cache-Control': 'public, max-age=29030400, immutable',
    'Content-Length': entry.size.toString()
  }

  if (request.method === 'HEAD') {
    return new Response(null, { headers })
  }
  if (request.method !== 'GET') {
    throw new HttpError('method not allowed', { status: 405 })
  }

  /** @type {import('dagula').AbsoluteRange|undefined} */
  let range
  if (request.headers.has('range')) {
    /** @type {import('dagula').Range[]} */
    let ranges = []
    try {
      ranges = decodeRangeHeader(request.headers.get('range') ?? '')
    } catch (err) {
      throw new HttpError('invalid range', { cause: err, status: 400 })
    }

    if (ranges.length > 1) {
      throw new HttpError('multipart byte range unsupported', { status: 400 })
    }

    range = resolveRange(ranges[0], Number(entry.size))
  }

  console.log('unixfs root', entry.cid.toString())
  const status = range ? 206 : 200
  const contentLength = range ? range[1] - range[0] + 1 : Number(entry.size)
  const exportOpts = range ? { offset: range[0], length: range[1] - range[0] + 1 } : {}
  const contentIterator = entry.content(exportOpts)[Symbol.asyncIterator]()
  const { done, value: firstChunk } = await contentIterator.next()
  if (done || !firstChunk.length) {
    return new Response(null, { status: 204, headers })
  }

  const fileName = entry.path.split('/').pop() || ''
  const contentType = detectContentType(fileName, firstChunk)
  if (contentType) {
    headers['Content-Type'] = contentType
  }

  if (range && Number(entry.size) !== contentLength) {
    const contentRange = `bytes ${range[0]}-${range[1]}/${entry.size}`
    headers['Content-Range'] = contentRange
    headers['Content-Length'] = contentLength.toString()
  }

  // stream the remainder
  const stream = toReadableStream((async function * () {
    let bytesWritten = firstChunk.length
    yield firstChunk
    try {
      // @ts-ignore
      for await (const chunk of contentIterator) {
        bytesWritten += chunk.length
        yield chunk
      }
      // FixedLengthStream does not like when you send less than what you said
      if (bytesWritten < contentLength) {
        console.warn(`padding with ${contentLength - bytesWritten} zeroed bytes`)
        yield new Uint8Array(contentLength - bytesWritten)
      }
    } catch (/** @type {any} */ err) {
      console.error(err.stack)
      throw err
    }
  })())

  return new Response(stream, { status, headers })
}
