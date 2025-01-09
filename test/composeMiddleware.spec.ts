import { describe, it } from 'node:test'
import assert from 'node:assert'
import { expectTypeOf } from 'expect-type'

import { Middleware, Handler } from '../src/bindings.js'
import { composeMiddleware } from '../src/composeMiddleware.js'

const handler: Handler<{ more: string }, {}> = async (_request, env, ctx) => {
  return new Response(JSON.stringify({ env, ctx }))
}

const withUser: Middleware<{}, { user: string }, { RESOURCE1: string }> =
  (handler) => async (request, env, ctx) => {
    return handler(request, env, { ...ctx, user: 'joey' })
  }

const withData: Middleware<{}, { data: string }> =
  (handler) => async (request, env, ctx) => {
    return handler(request, env, { ...ctx, data: 'some-stuff' })
  }

const usingUser: Middleware<{ user: string }, {}, { RESOURCE2: string }> =
  (handler) => async (request, env, ctx) => {
    return handler(request, env, ctx)
  }

const usingData: Middleware<{ data: string }, {}, { RESOURCE1: string }> =
  (handler) => async (request, env, ctx) => {
    return handler(request, env, ctx)
  }

const req = new Request('http://example.com/')

describe(composeMiddleware.name, () => {
  it('can compose a single middleware', async () => {
    const composed = composeMiddleware(usingUser)
    const wrappedHandler = composed(handler)

    expectTypeOf(wrappedHandler).parameters.branded.toEqualTypeOf<
      [Request, { RESOURCE2: string }, { user: string; more: string }]
    >()

    const response = await wrappedHandler(
      req,
      { RESOURCE2: 'resource2' },
      { user: 'joey', more: 'context' }
    ).then((res) => res.json())

    assert.deepStrictEqual(response, {
      env: { RESOURCE2: 'resource2' },
      ctx: { user: 'joey', more: 'context' },
    })
  })

  it('can compose middlewares which require things', async () => {
    const composed = composeMiddleware(usingUser, usingData)
    const wrappedHandler = composed(handler)

    expectTypeOf(wrappedHandler).parameters.branded.toEqualTypeOf<
      [
        Request,
        { RESOURCE1: string; RESOURCE2: string },
        { user: string; data: string; more: string },
      ]
    >()

    const response = await wrappedHandler(
      req,
      { RESOURCE1: 'resource1', RESOURCE2: 'resource2' },
      { user: 'joey', data: 'some-stuff', more: 'context' }
    ).then((res) => res.json())

    assert.deepStrictEqual(response, {
      env: { RESOURCE1: 'resource1', RESOURCE2: 'resource2' },
      ctx: { user: 'joey', data: 'some-stuff', more: 'context' },
    })
  })

  it('can compose middlewares which provide things', async () => {
    const composed = composeMiddleware(withUser, withData)
    const wrappedHandler = composed(handler)

    expectTypeOf(wrappedHandler).parameters.branded.toEqualTypeOf<
      [Request, { RESOURCE1: string }, { more: string }]
    >()

    const response = await wrappedHandler(
      req,
      { RESOURCE1: 'resource1' },
      { more: 'context' }
    ).then((res) => res.json())

    assert.deepStrictEqual(response, {
      env: { RESOURCE1: 'resource1' },
      ctx: { user: 'joey', data: 'some-stuff', more: 'context' },
    })
  })

  it('can compose middlewares which require and provide things', async () => {
    const composed = composeMiddleware(withUser, usingUser)
    const wrappedHandler = composed(handler)

    expectTypeOf(wrappedHandler).parameters.branded.toEqualTypeOf<
      [Request, { RESOURCE1: string; RESOURCE2: string }, { more: string }]
    >()

    const response = await wrappedHandler(
      req,
      { RESOURCE1: 'resource1', RESOURCE2: 'resource2' },
      { more: 'context' }
    ).then((res) => res.json())

    assert.deepStrictEqual(response, {
      env: { RESOURCE1: 'resource1', RESOURCE2: 'resource2' },
      ctx: { user: 'joey', more: 'context' },
    })
  })
})
