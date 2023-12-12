/* eslint-env browser */
import { fromString } from 'uint8arrays/from-string'
import Handlebars from '@web3-storage/handlebars/runtime.js'
import bytes from 'bytes'
import { toReadableStream } from '../util/streams.js'
import { handleUnixfsFile } from './unixfs-file.js'

await import('./templates/bundle.cjs')

/**
 * @typedef {import('../bindings.js').UnixfsEntryContext & import('../bindings.js').IpfsUrlContext & import('../bindings.js').DagulaContext & { timeoutController?: import('../bindings.js').TimeoutControllerContext['timeoutController'] }} UnixfsDirectoryHandlerContext
 */

/**
 * @param {string} name
 * @param {(v: any) => string} fn
 */
// @ts-ignore missing handlebars types
const registerHelper = (name, fn) => Handlebars.registerHelper(name, fn)

/**
 * @param {string} name
 * @returns {(data?: any) => string}
 */
// @ts-ignore missing handlebars types
const getTemplate = (name) => Handlebars.templates[name]

registerHelper('encodeIPFSPath', (/** @type {string} */ p) => p.split('/').map(s => encodeURIComponent(s)).join('/'))
registerHelper('encodeURIComponent', encodeURIComponent)
registerHelper('iconFromExt', name => {
  const ext = name.slice(name.lastIndexOf('.') + 1)
  return knownIcons[ext] ? `ipfs-${ext}` : 'ipfs-_blank'
})
registerHelper('shortHash', h => h.length < 9 ? h : `${h.slice(0, 4)}\u2026${h.slice(-4)}`)
registerHelper('formatBytes', n => bytes(n, { unitSeparator: ' ' }))

const knownIcons = Object.fromEntries([
  'aac', 'aiff', 'ai', 'avi', 'bmp', 'c', 'cpp', 'css', 'dat', 'dmg', 'doc',
  'dotx', 'dwg', 'dxf', 'eps', 'exe', 'flv', 'gif', 'h', 'hpp', 'html', 'ics',
  'iso', 'java', 'jpg', 'jpeg', 'js', 'key', 'less', 'mid', 'mkv', 'mov',
  'mp3', 'mp4', 'mpg', 'odf', 'ods', 'odt', 'otp', 'ots', 'ott', 'pdf', 'php',
  'png', 'ppt', 'psd', 'py', 'qt', 'rar', 'rb', 'rtf', 'sass', 'scss', 'sql',
  'tga', 'tgz', 'tiff', 'txt', 'wav', 'wmv', 'xls', 'xlsx', 'xml', 'yml', 'zip'
].map(ext => [ext, true]))

/** @type {import('../bindings.js').Handler<UnixfsDirectoryHandlerContext>} */
export async function handleUnixfsDir (request, env, ctx) {
  const { unixfsEntry: entry, timeoutController: controller, dagula, dataCid, path } = ctx
  if (!entry) throw new Error('missing unixfs entry')
  if (!entry.type.includes('directory')) throw new Error('non unixfs directory entry')
  if (!dagula) throw new Error('missing dagula instance')

  // serve index.html if directory contains one
  try {
    const indexPath = `${dataCid}${path}${path.endsWith('/') ? '' : '/'}index.html`
    const fileEntry = await dagula.getUnixfs(indexPath, { signal: controller?.signal })
    ctx.unixfsEntry = fileEntry
    return handleUnixfsFile(request, env, ctx)
  } catch (/** @type {any} */ err) {
    if (err.code !== 'ERR_NOT_FOUND') throw err
  }

  const headers = {
    'Content-Type': 'text/html',
    Etag: `"DirIndex-gateway-lib@2.0.2_CID-${entry.cid}"`
  }

  if (request.method === 'HEAD') {
    return new Response(null, { headers })
  }

  const isSubdomain = new URL(request.url).hostname.includes('.ipfs.')
  /** @param {string} p CID path like "<cid>[/optional/path]" */
  const entryPath = p => isSubdomain ? p.split('/').slice(1).join('/') : `/ipfs/${p}`

  const stream = toReadableStream((async function * () {
    const parts = entry.path.split('/')
    yield fromString(
      getTemplate('unixfs-dir-header')({
        path: entryPath(entry.path),
        name: entry.name,
        hash: entry.cid.toString(),
        size: Number(entry.size),
        backLink: parts.length > 1 ? entryPath(parts.slice(0, -1).join('/')) : '',
        breadcrumbs: ['ipfs', ...parts].map((name, i, parts) => {
          const path = i > 0 ? entryPath(parts.slice(1, i + 1).join('/')) : null
          return { name, path }
        })
      })
    )
    try {
      for await (const dirEntry of entry.content()) {
        controller?.reset()
        yield fromString(
          getTemplate('unixfs-dir-entries')({
            entries: [{
              path: entryPath(dirEntry.path),
              name: dirEntry.name,
              hash: dirEntry.cid.toString(),
              size: Number(dirEntry.size)
            }]
          })
        )
      }
      yield fromString(getTemplate('unixfs-dir-footer')())
    } catch (/** @type {any} */ err) {
      console.error(err.stack)
      throw err
    }
  })())

  return new Response(stream, { headers })
}
