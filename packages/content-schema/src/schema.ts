import {defineArrayMember, defineField, defineType} from 'sanity'
import {salePriceIsLessThanPrice, uniqueSku, validVariantSkus} from './validators.js'

const category = defineType({
  name: 'category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required().min(3).max(50),
    }),
  ],
})

const seo = defineType({
  name: 'seo',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'SEO title',
      type: 'string',
      validation: (rule) => [
        rule.required().max(60).error('An SEO title of at most 60 characters is required'),
        rule.max(50).warning('Titles under 50 characters usually display better'),
      ],
    }),
    defineField({
      name: 'description',
      type: 'text',
      validation: (rule) => rule.max(160).warning('Keep descriptions under 160 characters'),
    }),
  ],
})

const product = defineType({
  name: 'product',
  type: 'document',
  validation: (rule) =>
    rule.custom((document: any) => {
      // Document-level validation can point the marker at a nested field.
      if (document?.status === 'active' && !document?.seo?.description) {
        return {message: 'Active products need an SEO description', path: ['seo', 'description']}
      }
      return true
    }),
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required().min(3).max(80),
    }),
    defineField({
      name: 'sku',
      type: 'string',
      validation: (rule) =>
        rule
          .required()
          .regex(/^[A-Z]{3}-\d{4}$/, {name: 'SKU'})
          .custom(uniqueSku),
    }),
    defineField({
      name: 'status',
      type: 'string',
      options: {list: ['draft', 'active', 'archived'], layout: 'radio'},
      validation: (rule) =>
        rule.required().custom((value) =>
          ['draft', 'active', 'archived'].includes(value as string) || 'Choose a valid status',
        ),
    }),
    defineField({
      name: 'price',
      type: 'number',
      validation: (rule) => rule.required().positive().precision(2).max(100_000),
    }),
    defineField({
      name: 'salePrice',
      type: 'number',
      validation: (rule) =>
        rule
          .min(0)
          .max(rule.valueOfField('price'))
          .custom(salePriceIsLessThanPrice),
    }),
    defineField({
      name: 'supportEmail',
      type: 'string',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'website',
      type: 'url',
      validation: (rule) => rule.uri({scheme: ['http', 'https'], allowRelative: false}),
    }),
    defineField({
      name: 'category',
      type: 'reference',
      to: [{type: 'category'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.min(1).max(5).unique(),
    }),
    defineField({
      name: 'seo',
      type: 'seo',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'variants',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'variant',
          type: 'object',
          fields: [
            defineField({name: 'sku', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'inventory', type: 'number', validation: (rule) => rule.integer().min(0)}),
          ],
        }),
      ],
      validation: (rule) => rule.custom(validVariantSkus),
    }),
  ],
})

export const schemaTypes = [category, seo, product]
