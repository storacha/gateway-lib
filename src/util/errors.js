export class HttpError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, cause?: any }} [options]
   */
  constructor (message, options = {}) {
    super(message, options)
    this.status = options.status == null ? 500 : options.status
  }
}
