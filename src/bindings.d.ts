import type { CID } from 'multiformats/cid'
import type { UnixFSEntry } from '@web3-storage/fast-unixfs-exporter'
import type { IDagula } from 'dagula'
import type { TimeoutController } from 'timeout-abort-controller'

export {}

export interface Environment {
  DEBUG: string
}

export interface Context {
  waitUntil(promise: Promise<void>): void
}

export interface IpfsUrlContext extends Context {
  dataCid: CID
  path: string
  searchParams: URLSearchParams
}

export interface TimeoutControllerContext extends Context {
  timeoutController: TimeoutController
}

export interface DagulaContext extends Context {
  dagula: IDagula
}

export interface UnixfsEntryContext extends Context {
  unixfsEntry: UnixFSEntry
}

export interface Handler<C extends Context, E extends Environment = Environment> {
  (request: Request, env: E, ctx: C): Promise<Response>
}

/**
 * Middleware is a function that returns a handler with a possibly extended
 * context object. The first generic type is the "extended context". i.e. what
 * the context looks like after the middleware is run. The second generic type
 * is the "base context", or in other words the context _required_ by the
 * middleware for it to run. The third type is the environment, which should
 * not be modified.
 */
export interface Middleware<XC extends BC, BC extends Context = Context, E extends Environment = Environment> {
  (h: Handler<XC, E>): Handler<BC, E>
}
