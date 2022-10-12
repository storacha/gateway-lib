/* eslint-env browser */
import { TimeoutController } from 'timeout-abort-controller'
import { HttpError } from './util/errors.js'
import { parseCid, tryParseCid } from './util/cid.js'

/** @typedef {import('./bindings').Context} Context */

/**
 * Adds CORS headers to the response.
 * @type {import('./bindings').Middleware<Context>}
 */
export function withCorsHeaders (handler) {
  return async (request, env, ctx) => {
    let response = await handler(request, env, ctx)
    // Clone the response so that it's no longer immutable (like if it comes
    // from cache or fetch)
    response = new Response(response.body, response)
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
 * @type {import('./bindings').Middleware<Context>}
 */
export function withContentDispositionHeader (handler) {
  return async (request, env, ctx) => {
    let response = await handler(request, env, ctx)
    // Clone the response so that it's no longer immutable (like if it comes
    // from cache or fetch)
    response = new Response(response.body, response)

    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('filename')
    const download = searchParams.get('download')
    if (fileName && download) {
      response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`)
    } else if (download) {
      response.headers.set('Content-Disposition', 'attachment')
    } else if (fileName) {
      response.headers.set('Content-Disposition', `inline; filename="${fileName}"`)
    }

    return response
  }
}

/**
 * Catches any errors, logs them and returns a suitable response.
 * @type {import('./bindings').Middleware<Context>}
 */
export function withErrorHandler (handler) {
  return async (request, env, ctx) => {
    try {
      return await handler(request, env, ctx)
    } catch (/** @type {any} */ err) {
      if (!err.status || err.status >= 500) console.error(err.stack)
      const msg = env.DEBUG === 'true' ? err.stack : err.message
      return new Response(msg, { status: err.status || 500 })
    }
  }
}

/**
 * Validates the request uses a HTTP GET method.
 * @type {import('./bindings').Middleware<Context>}
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
 * @type {import('./bindings').Middleware<import('./bindings').IpfsUrlContext>}
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
      const ipfsUrlCtx = { ...ctx, dataCid, path: pathname, searchParams }
      return handler(request, env, ipfsUrlCtx)
    }

    const pathParts = pathname.split('/')
    if (pathParts[1] !== 'ipfs') {
      throw new HttpError(`unsupported protocol: ${pathParts[1]}`, { status: 400 })
    }
    dataCid = parseCid(pathParts[2])
    const path = pathParts.slice(3).join('/')
    const ipfsUrlCtx = { ...ctx, dataCid, path: path ? `/${path}` : '', searchParams }
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
  /** @type {import('./bindings').Middleware<import('./bindings').TimeoutControllerContext>} */
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
 * @param {...import('./bindings').Middleware<any>} middlewares
 * @returns {import('./bindings').Middleware<any>}
 */
export function composeMiddleware (...middlewares) {
  return handler => middlewares.reduceRight((h, m) => m(h), handler)
}
