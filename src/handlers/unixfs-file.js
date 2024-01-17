/* eslint-env browser */
import { toReadableStream } from '../util/streams.js'
import { detectContentType } from '../util/mime.js'

/**
 * @typedef {import('../bindings.js').UnixfsEntryContext} UnixfsFileHandlerContext
 */

/** @type {import('../bindings.js').Handler<UnixfsFileHandlerContext>} */
export async function handleUnixfsFile (request, env, ctx) {
  const { unixfsEntry: entry } = ctx
  if (!entry) throw new Error('missing unixfs entry')
  if (entry.type !== 'file' && entry.type !== 'raw' && entry.type !== 'identity') {
    throw new Error('non unixfs file entry')
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

  console.log('unixfs root', entry.cid.toString())
  const contentIterator = entry.content()[Symbol.asyncIterator]()
  const { done, value: firstChunk } = await contentIterator.next()
  if (done || !firstChunk.length) {
    return new Response(null, { status: 204, headers })
  }

  const fileName = entry.path.split('/').pop() || ''
  const contentType = detectContentType(fileName, firstChunk)
  if (contentType) {
    headers['Content-Type'] = contentType
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
      const entrySize = Number(entry.size)
      if (bytesWritten < entry.size) {
        console.warn(`padding with ${entrySize - bytesWritten} zeroed bytes`)
        yield new Uint8Array(entrySize - bytesWritten)
      }
    } catch (/** @type {any} */ err) {
      console.error(err.stack)
      throw err
    }
  })())

  return new Response(stream, { headers })
}
