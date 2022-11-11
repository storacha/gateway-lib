import { filetypeinfo } from 'magic-bytes.js'
import { lookup } from 'mrmime'
import chardet from 'chardet'
import { toString } from 'uint8arrays'

/**
 * @param {string} fileName
 * @param {Uint8Array} bytes
 */
export function detectContentType (fileName = '', bytes) {
  const mime = detectMagicBytes(fileName, bytes)
  if (mime === 'application/xml') {
    // xml could be svg or other specialised type, so dig deeper
    return lookup(fileName) || detectTextContent(bytes, mime) || mime
  }
  return mime || lookup(fileName) || detectTextContent(bytes)
}

/**
 * @param {string} fileName
 * @param {Uint8Array} bytes
 */
function detectMagicBytes (fileName, bytes) {
  const infos = filetypeinfo(bytes)
  if (infos.length) {
    const idx = fileName.lastIndexOf('.')
    const ext = idx === -1 ? '' : fileName.slice(idx + 1)
    const info = infos.find(i => i.mime && i.extension === ext)
    if (info?.mime) return info.mime
    if (infos[0].mime) return infos[0].mime
  }
}

/** @param {Uint8Array} bytes */
function detectTextContent (bytes, defaultMime = 'text/plain') {
  const encoding = chardet.detect(bytes)
  if (!encoding) return
  let mime = defaultMime
  if (encoding === 'UTF-8' || encoding === 'ISO-8859-1') {
    const text = toString(bytes).toLowerCase()
    if (text.startsWith('<!doctype html')) {
      mime = 'text/html'
    } else if (text.includes('<svg')) {
      mime = 'image/svg+xml'
    } else if (text.startsWith('<?xml')) {
      mime = 'application/xml'
    }
  }
  return `${mime}; charset=${encoding}`
}
