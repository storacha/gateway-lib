# gateway-lib

Shared library of components for building an IPFS gateway in Cloudflare workers.

## Install

```sh
npm install @web3-storage/gateway-lib
```

## Usage

This module provides middleware, handlers and some utilities. Handlers require certain context properties to set which the middlewares can provide. The only BYO requirement is a middleware that adds a `dagula` instance to the context.

Typical usage may be something like:

```js
import {
  withContext,
  withCorsHeaders,
  withContentDispositionHeader,
  withErrorHandler,
  withHttpGet,
  withParsedIpfsUrl,
  composeMiddleware
} from '@web3-storage/gateway-lib/middleware'
import {
  handleUnixfs,
  handleBlock,
  handleCar
} from '@web3-storage/gateway-lib/handlers'

export default {
  fetch (request, env, ctx) {
    const middleware = composeMiddleware(
      withContext,
      withCorsHeaders,
      withContentDispositionHeader,
      withErrorHandler,
      withHttpGet,
      withParsedIpfsUrl,
      withDagula // Note: provided by library consumer (sets `dagula` on ctx)
    )
    return middleware(handler)(request, env, ctx)
  }
}

async function handler (request, env, ctx) {
  const { searchParams } = ctx
  if (searchParams.get('format') === 'raw') {
    return await handleBlock(request, env, ctx)
  }
  if (searchParams.get('format') === 'car') {
    return await handleCar(request, env, ctx)
  }
  return await handleUnixfs(request, env, ctx)
}
```

## Contributing

Feel free to join in. All welcome. [Open an issue](https://github.com/storacha/gateway-lib/issues)!

## License

Dual-licensed under [MIT + Apache 2.0](https://github.com/storacha/gateway-lib/blob/main/LICENSE.md)
