# Changelog

## [4.0.0](https://github.com/web3-storage/gateway-lib/compare/v3.5.1...v4.0.0) (2023-12-12)


### ⚠ BREAKING CHANGES

* tsconfig.json uses module=NodeNext ([#52](https://github.com/web3-storage/gateway-lib/issues/52))

### Features

* tsconfig.json uses module=NodeNext ([#52](https://github.com/web3-storage/gateway-lib/issues/52)) ([443bd58](https://github.com/web3-storage/gateway-lib/commit/443bd58f196cc7f7b23999fc57a9d74d6b327be9))

## [3.5.1](https://github.com/web3-storage/gateway-lib/compare/v3.5.0...v3.5.1) (2023-09-19)


### Bug Fixes

* dfs block ordering ([914bd02](https://github.com/web3-storage/gateway-lib/commit/914bd022ff85db46f0db4eca67d47b30cbc46eef))

## [3.5.0](https://github.com/web3-storage/gateway-lib/compare/v3.4.3...v3.5.0) (2023-08-25)


### Features

* support entity-bytes for CAR requests ([21e3f8f](https://github.com/web3-storage/gateway-lib/commit/21e3f8ff9e819e88f8a62601712cafcc9eeb1e8c))

## [3.4.3](https://github.com/web3-storage/gateway-lib/compare/v3.4.2...v3.4.3) (2023-08-22)


### Bug Fixes

* update dependencies ([1cc1d1d](https://github.com/web3-storage/gateway-lib/commit/1cc1d1ddc344506332b8b67093b4dfe08871f738))

## [3.4.2](https://github.com/web3-storage/gateway-lib/compare/v3.4.1...v3.4.2) (2023-08-15)


### Bug Fixes

* revert cache content of unknown size ([caef58a](https://github.com/web3-storage/gateway-lib/commit/caef58ad8c54fe6a8615be82d8f90b504232a3a0))

## [3.4.1](https://github.com/web3-storage/gateway-lib/compare/v3.4.0...v3.4.1) (2023-08-14)


### Bug Fixes

* dfs block retrieval ordering ([8974cd4](https://github.com/web3-storage/gateway-lib/commit/8974cd4852381dc41a78cadce48118b4cc9428c3))

## [3.4.0](https://github.com/web3-storage/gateway-lib/compare/v3.3.3...v3.4.0) (2023-08-02)


### Features

* support blake2b hashes ([9bd7d5d](https://github.com/web3-storage/gateway-lib/commit/9bd7d5d3487f4338f07c9f01ddfad8abc8d88652))


### Bug Fixes

* specify that Accept header varies response ([15b55c4](https://github.com/web3-storage/gateway-lib/commit/15b55c4860646d5b8e2da2eedcb6475206562f30))

## [3.3.3](https://github.com/web3-storage/gateway-lib/compare/v3.3.2...v3.3.3) (2023-08-02)


### Bug Fixes

* block yield for unknown hash ([856181f](https://github.com/web3-storage/gateway-lib/commit/856181fe42127a2ff456b718b3e7d04cc2c2abb9))
* unixfs type inconsistency ([0c3bc4f](https://github.com/web3-storage/gateway-lib/commit/0c3bc4fba2a511308870e6b5545b1bd7dad31355))

## [3.3.2](https://github.com/web3-storage/gateway-lib/compare/v3.3.1...v3.3.2) (2023-07-24)


### Bug Fixes

* do not cache if content-range response ([74972e7](https://github.com/web3-storage/gateway-lib/commit/74972e77d8b4b2bde75374146a55fb7671bd7b56))

## [3.3.1](https://github.com/web3-storage/gateway-lib/compare/v3.3.0...v3.3.1) (2023-07-24)


### Bug Fixes

* only add Content-Disposition header if not already exists ([#40](https://github.com/web3-storage/gateway-lib/issues/40)) ([f3cda76](https://github.com/web3-storage/gateway-lib/commit/f3cda76278a342934572c8f4944512f778df9a70))
* only cache get requests ([#42](https://github.com/web3-storage/gateway-lib/issues/42)) ([e5b1fe2](https://github.com/web3-storage/gateway-lib/commit/e5b1fe204d61b534157948341b9fee02e3b06cc3))

## [3.3.0](https://github.com/web3-storage/gateway-lib/compare/v3.2.4...v3.3.0) (2023-07-13)


### Features

* cache responses without a content-length header ([#38](https://github.com/web3-storage/gateway-lib/issues/38)) ([e65eb6c](https://github.com/web3-storage/gateway-lib/commit/e65eb6c971509cc399fc18f8dcf5664397dca29b))

## [3.2.4](https://github.com/web3-storage/gateway-lib/compare/v3.2.3...v3.2.4) (2023-06-30)


### Bug Fixes

* add context cloning middleware ([#36](https://github.com/web3-storage/gateway-lib/issues/36)) ([8b537e2](https://github.com/web3-storage/gateway-lib/commit/8b537e2a379b7a05fcb08c20f33f30e6b2076649))

## [3.2.3](https://github.com/web3-storage/gateway-lib/compare/v3.2.2...v3.2.3) (2023-06-13)


### Bug Fixes

* assign to context do not overwrite ([#34](https://github.com/web3-storage/gateway-lib/issues/34)) ([16a0ff9](https://github.com/web3-storage/gateway-lib/commit/16a0ff9c9d870dc0b8e87234d1894d071972eadf))

## [3.2.2](https://github.com/web3-storage/gateway-lib/compare/v3.2.1...v3.2.2) (2023-06-09)


### Bug Fixes

* entry size ([6b31e14](https://github.com/web3-storage/gateway-lib/commit/6b31e14c57ec66ec2dbec093c37af81ed63482fc))

## [3.2.1](https://github.com/web3-storage/gateway-lib/compare/v3.2.0...v3.2.1) (2023-06-09)


### Bug Fixes

* types for unixfs entry ([89efc2e](https://github.com/web3-storage/gateway-lib/commit/89efc2ef24cc92639ac3f46a1f7c9e8471113de1))

## [3.2.0](https://github.com/web3-storage/gateway-lib/compare/v3.1.1...v3.2.0) (2023-06-07)


### Features

* pull out 80k of css to a file so it can be cached ([#30](https://github.com/web3-storage/gateway-lib/issues/30)) ([71bdf8e](https://github.com/web3-storage/gateway-lib/commit/71bdf8e0a8c1f968356b4f17bbc6a14eecbccfbd))

## [3.1.1](https://github.com/web3-storage/gateway-lib/compare/v3.1.0...v3.1.1) (2023-05-30)


### Bug Fixes

* return HTTP 400 for CID parse error ([#27](https://github.com/web3-storage/gateway-lib/issues/27)) ([31eea2e](https://github.com/web3-storage/gateway-lib/commit/31eea2eefee0816b38e2bd40b3d52b687167fa20))

## [3.1.0](https://github.com/web3-storage/gateway-lib/compare/v3.0.0...v3.1.0) (2023-05-19)


### Features

* implement block order signaling ([#25](https://github.com/web3-storage/gateway-lib/issues/25)) ([1862165](https://github.com/web3-storage/gateway-lib/commit/18621658dc921c6754440b3e35b15494b266e0d6))

## [3.0.0](https://github.com/web3-storage/gateway-lib/compare/v2.0.3...v3.0.0) (2023-05-02)


### ⚠ BREAKING CHANGES

* CARs returned for cid+path will now be rooted at the root cid rather than the resovled cid for the end of the path and include all blocks needed to verify the path was traveresed correctly.

### Features

* support ?car-scope and verifiable paths for format=car ([#21](https://github.com/web3-storage/gateway-lib/issues/21)) ([7593a2f](https://github.com/web3-storage/gateway-lib/commit/7593a2f4572065e44c599cc887e039d7956107dc))

## [2.0.3](https://github.com/web3-storage/gateway-lib/compare/v2.0.2...v2.0.3) (2023-03-14)


### Bug Fixes

* allow hash in filenames ([#19](https://github.com/web3-storage/gateway-lib/issues/19)) ([b3449c3](https://github.com/web3-storage/gateway-lib/commit/b3449c320eba4b98ddd51ef8bccf321e31e38f8a))

## [2.0.2](https://github.com/web3-storage/gateway-lib/compare/v2.0.1...v2.0.2) (2022-11-11)


### Bug Fixes

* better content-type detection for svg ([#17](https://github.com/web3-storage/gateway-lib/issues/17)) ([3f01e09](https://github.com/web3-storage/gateway-lib/commit/3f01e099a44d011bce0f27680095989366a53988))

## [2.0.1](https://github.com/web3-storage/gateway-lib/compare/v2.0.0...v2.0.1) (2022-10-21)


### Bug Fixes

* paths with URI encoded components ([#15](https://github.com/web3-storage/gateway-lib/issues/15)) ([6467199](https://github.com/web3-storage/gateway-lib/commit/64671995fc61a0e24b7af37167c1170ca860cf83))

## [2.0.0](https://github.com/web3-storage/gateway-lib/compare/v1.3.0...v2.0.0) (2022-10-19)


### ⚠ BREAKING CHANGES

* The `handleUnixfsFile` handler no longer pipes through FixedLengthStream.

### Features

* add withFixedLengthStream middleware ([76bf7b5](https://github.com/web3-storage/gateway-lib/commit/76bf7b5e0bfe59350ea78b2269f88a8c73634004))

## [1.3.0](https://github.com/web3-storage/gateway-lib/compare/v1.2.1...v1.3.0) (2022-10-18)


### Features

* better debug messages in dev ([89873c8](https://github.com/web3-storage/gateway-lib/commit/89873c8c585d71838e90da56ac97a6451fda4774))
* send 412 when not cached and request wants it _only_ if it is cached ([#13](https://github.com/web3-storage/gateway-lib/issues/13)) ([0d822f8](https://github.com/web3-storage/gateway-lib/commit/0d822f84229bd3c1206f73eecd522b0796c58d87))

## [1.2.1](https://github.com/web3-storage/gateway-lib/compare/v1.2.0...v1.2.1) (2022-10-12)


### Bug Fixes

* drop response clone ([#8](https://github.com/web3-storage/gateway-lib/issues/8)) ([59bb00b](https://github.com/web3-storage/gateway-lib/commit/59bb00be5a3acb0729616790fc283896c248f952))
* only cache if success status ([#10](https://github.com/web3-storage/gateway-lib/issues/10)) ([103faf3](https://github.com/web3-storage/gateway-lib/commit/103faf3ca6a01424058d4380f56b96497e982d94))

## [1.2.0](https://github.com/web3-storage/gateway-lib/compare/v1.1.0...v1.2.0) (2022-10-12)


### Features

* add with cdn cache middleware ([#7](https://github.com/web3-storage/gateway-lib/issues/7)) ([05e3f7a](https://github.com/web3-storage/gateway-lib/commit/05e3f7aeb5b7bc37294832c7ca48bde1a9e9bb49))
* unixfs directory handler ([403ae6c](https://github.com/web3-storage/gateway-lib/commit/403ae6c9de9d4fc95a95dfab0546ce78bbf83794))


### Bug Fixes

* composeMiddleware type ([d101941](https://github.com/web3-storage/gateway-lib/commit/d101941e08a8b22945790f85aad7cf47f094182d))
* export types from bindings ([eaaa11e](https://github.com/web3-storage/gateway-lib/commit/eaaa11eb321588b298bc8e95a3c941e44319ac49))

## [1.1.0](https://github.com/web3-storage/gateway-lib/compare/v1.0.2...v1.1.0) (2022-10-12)


### Features

* add content disposition header ([#4](https://github.com/web3-storage/gateway-lib/issues/4)) ([52ec13d](https://github.com/web3-storage/gateway-lib/commit/52ec13d0605fa1ff01c0a34a279ec81f71360be9))


### Bug Fixes

* built types ([c5cedc4](https://github.com/web3-storage/gateway-lib/commit/c5cedc46f1b4399f1852f4c73dd4c08b2a1780c6))
* types ([b96c885](https://github.com/web3-storage/gateway-lib/commit/b96c885f6f9dc8f42e0e3e7202f908b29f7ea2df))
* used middleware name ([eac0d2c](https://github.com/web3-storage/gateway-lib/commit/eac0d2ccc33ee0ac3ab8849fef373866c77fe754))

## [1.0.2](https://github.com/web3-storage/gateway-lib/compare/v1.0.1...v1.0.2) (2022-10-12)


### Bug Fixes

* include src directory in published package ([f4d4bf2](https://github.com/web3-storage/gateway-lib/commit/f4d4bf2df888cd6c7ffcb8bb886dd1cfaec6bd0b))

## [1.0.1](https://github.com/web3-storage/gateway-lib/compare/v1.0.0...v1.0.1) (2022-10-12)


### Bug Fixes

* ci config ([9d378f2](https://github.com/web3-storage/gateway-lib/commit/9d378f244cc14e68b310d0e45dc39d20a6c289b1))

## 1.0.0 (2022-10-12)


### Features

* initial commit ([965eb00](https://github.com/web3-storage/gateway-lib/commit/965eb00ea4aea6451d853ed07bdb82b5cbcdbf55))
