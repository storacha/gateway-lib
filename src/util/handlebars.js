import Handlebars from '@web3-storage/handlebars/runtime.js'

export { Handlebars }

/**
 * @template T
 * @template {string|boolean} R
 * @param {string} name
 * @param {(v: T) => R} fn
 */
// @ts-ignore missing handlebars types
export const registerHelper = (name, fn) => Handlebars.registerHelper(name, fn)

/**
 * @template T
 * @param {string} name
 * @returns {(data?: T) => string}
 */
// @ts-ignore missing handlebars types
export const getTemplate = (name) => Handlebars.templates[name]
