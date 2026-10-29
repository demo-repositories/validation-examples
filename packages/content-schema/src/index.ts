import {Schema} from '@sanity/schema'
import {builtinTypes} from '@sanity/schema/_internal'
import type {ValidationSchema} from '@sanity/validation'
import {schemaTypes} from './schema.js'

export {schemaTypes} from './schema.js'
export {VALIDATION_API_VERSION} from './validators.js'

/**
 * `@sanity/validation` expects a compiled Sanity schema, not a JSON manifest.
 * Compile locally so custom validator functions remain executable.
 */
export function getValidationSchema(): ValidationSchema {
  return Schema.compile({
    name: 'validation-examples',
    types: [...builtinTypes, ...schemaTypes],
  })
}
