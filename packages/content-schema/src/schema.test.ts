import {describe, expect, it, vi} from 'vitest'
import {validateDocument} from '@sanity/validation'
import {getValidationSchema} from './index.js'
import {VALIDATION_API_VERSION} from './validators.js'

const validProduct: any = {
  _id: 'product-1',
  _type: 'product',
  title: 'Blue mug',
  sku: 'MUG-0001',
  status: 'active',
  price: 20,
  salePrice: 10,
  category: {_type: 'reference', _ref: 'category-1'},
  tags: ['ceramic'],
  seo: {title: 'Blue ceramic mug', description: 'A handmade blue ceramic mug.'},
  variants: [{_key: 'blue', _type: 'variant', sku: 'MUG-0001-BLUE', inventory: 2}],
}

function validationClient(taken = false) {
  const client: any = {
    fetch: vi.fn().mockResolvedValue(taken),
    getDataUrl: vi.fn(),
    request: vi.fn(),
    observable: {fetch: vi.fn()},
  }
  client.withConfig = vi.fn().mockReturnValue(client)
  return client
}

describe('product schema', () => {
  it('runs declarative rules and reports child paths from a custom validator', async () => {
    const client = validationClient()
    const result = await validateDocument({
      document: {
        ...validProduct,
        title: 'X',
        salePrice: 30,
        variants: [
          {_key: 'first', _type: 'variant', sku: 'DUP-0001', inventory: 1},
          {_key: 'second', _type: 'variant', sku: 'DUP-0001', inventory: -1},
        ],
      },
      schema: getValidationSchema(),
      client,
      getDocumentExists: () => Promise.resolve(true),
    })

    expect(result.markers.map((marker) => marker.path)).toEqual(
      expect.arrayContaining([['title'], ['salePrice'], ['variants', {_key: 'second'}, 'sku']]),
    )
  })

  it('uses the supplied client for a getClient validator', async () => {
    const client = validationClient(true)
    const result = await validateDocument({
      document: validProduct,
      schema: getValidationSchema(),
      client,
      getDocumentExists: () => Promise.resolve(true),
    })

    expect(client.withConfig).toHaveBeenCalledWith({apiVersion: VALIDATION_API_VERSION})
    expect(result.markers.some((marker) => marker.message.includes('already in use'))).toBe(true)
  })

  it('marks validation incomplete when custom validation is disabled', async () => {
    const result = await validateDocument({
      document: validProduct,
      schema: getValidationSchema(),
      client: validationClient(),
      customValidation: false,
      getDocumentExists: () => Promise.resolve(true),
    })

    expect(result.status).toBe('notEvaluated')
  })

  it('marks validation incomplete without a client for getClient rules', async () => {
    const result = await validateDocument({
      document: validProduct,
      schema: getValidationSchema(),
      getDocumentExists: () => Promise.resolve(true),
    })

    expect(result.status).toBe('notEvaluated')
  })

  it('can validate independent documents with the same schema', async () => {
    const results = await Promise.all(
      [validProduct, {...validProduct, _id: 'product-2', title: ''}].map((document) =>
        validateDocument({
          document,
          schema: getValidationSchema(),
          client: validationClient(),
          getDocumentExists: () => Promise.resolve(true),
        }),
      ),
    )

    expect(results).toHaveLength(2)
    expect(results[1].markers.some((marker) => marker.path[0] === 'title')).toBe(true)
  })
})
