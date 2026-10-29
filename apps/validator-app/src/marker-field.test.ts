import {describe, expect, it} from 'vitest'
import {markerFieldName} from './marker-field.js'

const document = {
  seo: {description: ''},
  variants: [
    {_key: 'one', sku: 'BLUE-0001'},
    {_key: 'two', sku: 'BLUE-0001'},
  ],
}

describe('markerFieldName', () => {
  it('maps nested fields and keyed array items onto React Hook Form names', () => {
    expect(markerFieldName(['seo', 'description'], document)).toBe('seo.description')
    expect(markerFieldName(['variants', {_key: 'two'}, 'sku'], document)).toBe('variants.1.sku')
    expect(markerFieldName([], document)).toBeUndefined()
  })
})
