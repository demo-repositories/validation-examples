import {getPublishedId} from 'sanity'

export const VALIDATION_API_VERSION = '2026-09-03'

/**
 * Async validators must use the context client so Studio and external callers
 * use the same dataset, credentials, abort signal, and concurrency limits.
 */
export async function uniqueSku(sku: unknown, context: any) {
  if (typeof sku !== 'string' || !context.document?._id) return true

  const client = context.getClient({apiVersion: VALIDATION_API_VERSION})
  const taken = await client.fetch(
    `defined(*[
      _type == "product" &&
      sku == $sku &&
      !sanity::versionOf($published)
    ][0]._id)`,
    {sku, published: getPublishedId(context.document._id)},
  )

  return taken ? `The SKU "${sku}" is already in use` : true
}

export function salePriceIsLessThanPrice(value: unknown, context: any) {
  if (value === undefined || value === null) return true
  if (typeof value !== 'number' || typeof context.parent?.price !== 'number') return true

  return value < context.parent.price || 'Sale price must be lower than price'
}

export function validVariantSkus(variants: unknown) {
  if (!Array.isArray(variants)) return true

  const duplicateSkus = variants
    .filter((variant) => variant?.sku)
    .filter((variant, index, all) => all.findIndex(({sku}) => sku === variant.sku) !== index)

  return duplicateSkus.length === 0
    ? true
    : duplicateSkus.map((variant) => ({
        message: `Variant SKU "${variant.sku}" is repeated`,
        path: [{_key: variant._key}, 'sku'],
      }))
}
