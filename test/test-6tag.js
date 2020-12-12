/* eslint-env mocha */

import chai from 'chai'

import { Token, Type } from '../lib/token.js'
import { decode, encode } from '../cborg.js'
import { fromHex, toHex } from '../lib/common.js'

const { assert } = chai

function dateDecoder (obj) {
  if (typeof obj !== 'string') {
    throw new Error('expected string for tag 1')
  }
  return new Date(obj)
}

function * dateEncoder (obj) {
  if (!(obj instanceof Date)) {
    throw new Error('expected Date for "Date" encoder')
  }
  yield new Token(Type.tag, 0)
  yield new Token(Type.string, obj.toISOString().replace(/\.000Z$/, 'Z'))
}

function Uint16ArrayDecoder (obj) {
  if (typeof obj !== 'string') {
    throw new Error('expected string for tag 23')
  }
  const u8a = fromHex(obj)
  return new Uint16Array(u8a.buffer)
}

function * Uint16ArrayEncoder (obj) {
  if (!(obj instanceof Uint16Array)) {
    throw new Error('expected Uint16Array for "Uint16Array" encoder')
  }
  yield new Token(Type.tag, 23)
  yield new Token(Type.string, toHex(obj))
}

describe('tag', () => {
  it('date', () => {
    assert.throws(() => encode({ d: new Date() }), /unsupported type: Date/)

    assert.equal(
      toHex(encode(new Date('2013-03-21T20:04:00Z'), { typeEncoders: { Date: dateEncoder } })),
      'c074323031332d30332d32315432303a30343a30305a' // from appendix_a
    )

    const decodedDate = decode(fromHex('c074323031332d30332d32315432303a30343a30305a'), { tags: { 0: dateDecoder } })
    assert.instanceOf(decodedDate, Date)
    assert.equal(decodedDate.toISOString(), new Date('2013-03-21T20:04:00Z').toISOString())
  })

  it('Uint16Array as hex/23 (overide existing type)', () => {
    assert.equal(
      toHex(encode(Uint16Array.from([1, 2, 3]), { typeEncoders: { Uint16Array: Uint16ArrayEncoder } })),
      'd76c303130303032303030333030' // tag(23) + string('010002000300')
    )

    const decoded = decode(fromHex('d76c303130303032303030333030'), { tags: { 23: Uint16ArrayDecoder } })
    assert.instanceOf(decoded, Uint16Array)
    assert.equal(toHex(decoded), toHex(Uint16Array.from([1, 2, 3])))
  })
})