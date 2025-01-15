import type { CID } from 'multiformats/cid'
import type { UnixFSEntry } from 'ipfs-unixfs-exporter'
import type { BlockService, DagService, UnixfsService } from 'dagula'
import type { TimeoutController } from 'timeout-abort-controller'

export {}

export interface DebugEnvironment {
  DEBUG?: string
}

export interface CloudflareContext {
  waitUntil(promise: Promise<void>): void
}

export interface IpfsUrlContext {
  dataCid: CID
  path: string
  searchParams: URLSearchParams
}

export interface TimeoutControllerContext {
  timeoutController: TimeoutController
}

export interface BlockContext {
  blocks: BlockService
}

export interface DagContext {
  dag: DagService
}

export interface UnixfsContext {
  unixfs: UnixfsService
}

export interface UnixfsEntryContext {
  unixfsEntry: UnixFSEntry
}

/**
 * A Handler handles a request. It's an async function which takes a
 * {@link Request} and returns a {@link Response}. It also has access to the
 * context and environment for the request.
 *
 * @template Context The context keys used by the handler.
 * @template Env The environment keys used by the handler.
 */
export type Handler<Context extends {} = {}, Env extends {} = {}> = (
  request: Request,
  env: Env,
  ctx: Context
) => Promise<Response>

/**
 * A Middleware is a function that takes a {@link Handler} and returns a new
 * one. It has access to the context and environment for the request. It can
 * add to the context, or modify it, but it should not remove keys, so that
 * upstream middleware can pass context to downstream middleware. It should
 * generally not modify the environment, as that is shared across all requests.
 *
 * @template RequiredContext The context required by the middleware. These keys
 * must be either provided by upstream middleware, or given to the ultimate
 * handler.
 * @template AddedContext The context added by the middleware. These keys will
 * be available to downstream middleware.
 * @template Env The environment keys used by the middleware. The entire
 * environment should be passed to the outermost handler, at the top of the
 * middleware stack. Middleware shouldn't modify the environment, and should
 * pass it in its entirety when it calls the next handler.
 */
export type Middleware<
  RequiredContext extends {} = {},
  AddedContext extends {} = {},
  Env extends {} = {},
> =
  /**
   * @template HandlerRequiredContext The context required by the wrapped
   * handler.
   * @template HandlerEnv The environment keys used by the wrapped handler.
   */
  <HandlerRequiredContext extends {}, HandlerEnv extends {}>(
    h: Handler<AddedContext & HandlerRequiredContext, Env & HandlerEnv>
  ) => Handler<RequiredContext & HandlerRequiredContext, Env & HandlerEnv>

export type RequiredContextOf<M extends Middleware<any, any, any>> =
  M extends Middleware<infer T, any, any> ? T : never

export type AddedContextOf<M extends Middleware<any, any, any>> =
  M extends Middleware<any, infer T, any> ? T : never

export type EnvOf<M extends Middleware<any, any, any>> =
  M extends Middleware<any, any, infer T> ? T : never
