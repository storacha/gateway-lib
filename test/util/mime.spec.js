import { describe, it } from 'node:test'
import assert from 'node:assert'
import { detectContentType } from '../../src/util/mime.js'

describe('mime', () => {
  it('should return xml for a file with an xml declaration', () => {
    // https://www.w3.org/TR/REC-xml/#sec-prolog-dtd
    const str = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><root></root>'
    const bytes = new TextEncoder().encode(str)
    assert.equal(detectContentType('test.xml', bytes), 'application/xml')
    assert.equal(detectContentType(undefined, bytes), 'application/xml; charset=ASCII')
  })

  it('should return svg for an svg file with xml declaration', () => {
    // https://www.w3.org/TR/SVG2/struct.html#NewDocument
    const str = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg></svg>'
    const bytes = new TextEncoder().encode(str)
    assert.equal(detectContentType('test.svg', bytes), 'image/svg+xml')
    assert.equal(detectContentType(undefined, bytes), 'image/svg+xml; charset=ASCII')
  })

  it('should return svg for a file with an svg element as root', () => {
    // https://www.w3.org/TR/SVG2/struct.html#NewDocument
    const str = '<svg></svg>'
    const bytes = new TextEncoder().encode(str)
    assert.equal(detectContentType('test.svg', bytes), 'image/svg+xml')
    // Note: chardet uses byte occurance statistics to guess char encoding. This short string tips in favour of UTF-8.
    // see: https://github.com/runk/node-chardet/blob/master/src/index.ts#L52-L53
    assert.equal(detectContentType(undefined, bytes), 'image/svg+xml; charset=ASCII')
  })

  it('should return html for an html file', () => {
    // https://html.spec.whatwg.org/multipage/syntax.html#the-doctype
    const str = '<!DOCTYPE html><svg></svg>'
    const bytes = new TextEncoder().encode(str)
    assert.equal(detectContentType('test.html', bytes), 'text/html')
    assert.equal(detectContentType(undefined, bytes), 'text/html; charset=ASCII')
  })
})
