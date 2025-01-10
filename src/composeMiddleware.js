/** @import { Middleware } from './bindings.js' */

/**
 * Composes multiple middleware functions into a single middleware function.
 *
 * @param {...Middleware<any, any, any>} middlewares - The middleware functions to compose.
 * @returns {Middleware<any, any, any>} A single middleware function that is the result of composing the input middleware functions.
 */
export function composeMiddleware (...middlewares) {
  return (handler) => middlewares.reduceRight((h, m) => m(h), handler)
}
