/* eslint-env browser */
/* global caches FixedLengthStream */
import { TimeoutController } from 'timeout-abort-controller'
import { HttpError } from './util/errors.js'
import { parseCid, tryParseCid } from './util/cid.js'

/** @typedef {import('./bindings.js').Context} Context */

const CF_CACHE_MAX_OBJECT_SIZE = 512 * Math.pow(1024, 2) // 512MB to bytes

/**
 * Creates a fresh context object that can be mutated by the request.
 *
 * The original context object is _shared_ among requests so should be cloned
 * ASAP using this middleware and the clone should be mutated not the original.
 *
 * Some properties in the original context object are not enumerable so need
 * to be expicitly added.
 *
 * @type {import('./bindings.js').Middleware<Context>}
 */
export function withContext (handler) {
  return (request, env, ctx) => {
    const context = { ...ctx, waitUntil: ctx.waitUntil.bind(ctx) }
    return handler(request, env, context)
  }
}

/**
 * Adds CORS headers to the response.
 * @type {import('./bindings.js').Middleware<Context>}
 */
export function withCorsHeaders (handler) {
  return async (request, env, ctx) => {
    const response = await handler(request, env, ctx)
    const origin = request.headers.get('origin')
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Vary', 'Origin')
    } else {
      response.headers.set('Access-Control-Allow-Origin', '*')
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET')
    // response.headers.append('Access-Control-Allow-Headers', 'Range')
    // response.headers.append('Access-Control-Allow-Headers', 'Content-Range')
    response.headers.append('Access-Control-Expose-Headers', 'Content-Length')
    // response.headers.append('Access-Control-Expose-Headers', 'Content-Range')
    return response
  }
}

/**
 * Adds Content Disposition header to the response according to the request.
 * https://github.com/ipfs/specs/blob/main/http-gateways/PATH_GATEWAY.md#request-query-parameters
 * @type {import('./bindings.js').Middleware<Context>}
 */
export function withContentDispositionHeader (handler) {
  return async (request, env, ctx) => {
    const response = await handler(request, env, ctx)
    const { searchParams } = new URL(request.url)
    if (!response.headers.has('Content-Disposition')) {
      const fileName = searchParams.get('filename')
      const download = searchParams.get('download')
      if (fileName && download) {
        response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`)
      } else if (download) {
        response.headers.set('Content-Disposition', 'attachment')
      } else if (fileName) {
        response.headers.set('Content-Disposition', `inline; filename="${fileName}"`)
      }
    }
    return response
  }
}

/**
 * Catches any errors, logs them and returns a suitable response.
 * @type {import('./bindings.js').Middleware<Context>}
 */
export function withErrorHandler (handler) {
  return async (request, env, ctx) => {
    try {
      return await handler(request, env, ctx)
    } catch (/** @type {any} */ err) {
      if (!err.status || err.status >= 500) console.error(err.stack)
      const msg = env.DEBUG === 'true'
        ? `${err.stack}${err?.cause?.stack ? `\n[cause]: ${err.cause.stack}` : ''}`
        : err.message
      return new Response(msg, { status: err.status || 500 })
    }
  }
}

/**
 * Validates the request uses a HTTP GET method.
 * @type {import('./bindings.js').Middleware<Context>}
 */
export function withHttpGet (handler) {
  return (request, env, ctx) => {
    if (request.method !== 'GET') {
      throw Object.assign(new Error('method not allowed'), { status: 405 })
    }
    return handler(request, env, ctx)
  }
}

/**
 * Extracts the data CID, the path and search params from the URL.
 * @type {import('./bindings.js').Middleware<import('./bindings.js').IpfsUrlContext>}
 */
export function withParsedIpfsUrl (handler) {
  return (request, env, ctx) => {
    const { hostname, pathname, searchParams } = new URL(request.url)

    const hostParts = hostname.split('.')
    let dataCid = tryParseCid(hostParts[0])
    if (dataCid) {
      if (hostParts[1] !== 'ipfs') {
        throw new HttpError(`unsupported protocol: ${hostParts[1]}`, { status: 400 })
      }
      const ipfsUrlCtx = Object.assign(ctx, { dataCid, path: pathname, searchParams })
      return handler(request, env, ipfsUrlCtx)
    }

    const pathParts = pathname.split('/')
    if (pathParts[1] !== 'ipfs') {
      throw new HttpError(`unsupported protocol: ${pathParts[1]}`, { status: 400 })
    }
    try {
      dataCid = parseCid(pathParts[2])
    } catch {
      throw new HttpError(`invalid CID: ${pathParts[2]}`, { status: 400 })
    }
    const path = pathParts.slice(3).map(decodeURIComponent).join('/')
    const ipfsUrlCtx = Object.assign(ctx, { dataCid, path: path ? `/${path}` : '', searchParams })
    return handler(request, env, ipfsUrlCtx)
  }
}

/**
 * Creates a middleware that adds an TimeoutController (an AbortController) to
 * the context that times out after the passed milliseconds. Consumers can
 * optionally call `.reset()` on the controller to restart the timeout.
 * @param {number} timeout Timeout in milliseconds.
 */
export function createWithTimeoutController (timeout) {
  /** @type {import('./bindings.js').Middleware<import('./bindings.js').TimeoutControllerContext>} */
  return handler => {
    return async (request, env, ctx) => {
      const timeoutController = new TimeoutController(timeout)
      const timeoutCtx = { ...ctx, timeoutController }
      const response = await handler(request, env, timeoutCtx)
      if (!response.body) return response
      return new Response(
        response.body.pipeThrough(
          new TransformStream({
            flush () {
              // console.log('clearing timeout controller')
              timeoutController.clear()
            }
          })
        ),
        response
      )
    }
  }
}

/**
 * Intercepts request if content cached by just returning cached response.
 * Otherwise proceeds to handler.
 * @type {import('./bindings.js').Middleware<Context>}
 */
export function withCdnCache (handler) {
  return async (request, env, ctx) => {
    // Should skip cache if instructed by headers
    if ((request.headers.get('Cache-Control') || '').includes('no-cache')) {
      return handler(request, env, ctx)
    }
    // Can only cache GET requestz
    if (request.method !== 'GET') {
      return handler(request, env, ctx)
    }

    let response
    // Get from cache and return if existent
    /** @type {Cache} */
    // @ts-ignore Cloudflare Workers runtime exposes a single global cache object.
    const cache = caches.default
    response = await cache.match(request)
    if (response) {
      return response
    }

    // If not cached and request wants it _only_ if it is cached, send 412
    if (request.headers.get('Cache-Control') === 'only-if-cached') {
      return new Response(null, { status: 412 })
    }

    response = await handler(request, env, ctx)

    // cache the repsonse if success status
    if (response.ok && !response.headers.has('Content-Range')) {
      const contentLength = response.headers.get('Content-Length')
      if (contentLength && parseInt(contentLength) < CF_CACHE_MAX_OBJECT_SIZE) {
        ctx.waitUntil(cache.put(request, response.clone()))
      }
    }

    return response
  }
}

/**
 * Pipes reponse through a FixedLengthStream if `Content-Length` header is set.
 * https://developers.cloudflare.com/workers/runtime-apis/streams/transformstream/#fixedlengthstream
 *
 * @type {import('./bindings.js').Middleware<Context>}
 */
export function withFixedLengthStream (handler) {
  return async (request, env, ctx) => {
    const response = await handler(request, env, ctx)
    if (!response.headers.has('Content-Length') || !response.body) {
      return response
    }

    const contentLength = parseInt(response.headers.get('Content-Length') || '0')
    return new Response(
      // @ts-ignore FixedLengthStream is a cloudflare global
      response.body.pipeThrough(new FixedLengthStream(contentLength)),
      response
    )
  }
}

/**
 * @param {...import('./bindings.js').Middleware<any, any, any>} middlewares
 * @returns {import('./bindings.js').Middleware<any, any, any>}
 */
export function composeMiddleware (...middlewares) {
  return handler => middlewares.reduceRight((h, m) => m(h), handler)
}
