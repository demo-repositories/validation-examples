import {useEffect, useMemo, useState, type ReactNode} from 'react'
import {useFieldArray, useForm, useWatch, type FieldErrors, type Resolver, type ResolverResult} from 'react-hook-form'
import {
  validateDocument,
  type DocumentValidationResult,
  type ValidationClient,
  type ValidationSchema,
} from '@sanity/validation'
import type {Path, SanityDocument} from 'sanity'
import {markerFieldName} from './marker-field.js'

type VariantValues = {_key: string; sku: string; inventory: number}
type ProductFormValues = {
  title: string
  sku: string
  status: string
  price: number
  salePrice: number
  categoryId: string
  tags: string
  seo: {title: string; description: string}
  variants: VariantValues[]
}

const defaultValues: ProductFormValues = {
  title: 'X',
  sku: 'MUG-0001',
  status: 'active',
  price: 10,
  salePrice: 20,
  categoryId: 'category-ceramics',
  tags: '',
  seo: {title: 'A title that is valid enough to demonstrate a warning only', description: ''},
  variants: [
    {_key: 'one', sku: 'BLUE-0001', inventory: 1},
    {_key: 'two', sku: 'BLUE-0001', inventory: -1},
  ],
}

type ValidationState = {
  result: DocumentValidationResult
  document: SanityDocument
}

export function ProductForm({client, schema}: {client: ValidationClient; schema: ValidationSchema}) {
  const [validation, setValidation] = useState<ValidationState | null>(null)
  // React Hook Form calls this on change. The compiled schema is the only rule source.
  // Error markers become field errors. Warning markers are shown beside the field.
  // `notEvaluated` means a client-dependent rule did not run, so the values are rejected.
  const resolver = useMemo<Resolver<ProductFormValues>>(
    () => async (values): Promise<ResolverResult<ProductFormValues>> => {
      try {
        const document = toProductDocument(values)
        const result = await validateDocument({document, schema, client})
        setValidation({result, document})
        const hasErrors = result.status === 'notEvaluated' || result.markers.some((marker) => marker.level === 'error')
        return hasErrors ? {values: {}, errors: markersToFieldErrors(result, document)} : {values, errors: {}}
      } catch (error) {
        return {
          values: {},
          errors: {
            root: {type: 'exception', message: error instanceof Error ? error.message : String(error)},
          } as FieldErrors<ProductFormValues>,
        }
      }
    },
    [client, schema],
  )
  const {control, register, handleSubmit, trigger, formState} = useForm<ProductFormValues>({
    defaultValues,
    resolver,
    mode: 'onChange',
  })
  const variants = useFieldArray({control, name: 'variants'})
  const title = useWatch({control, name: 'title'})
  const status = useWatch({control, name: 'status'})

  useEffect(() => {
    // Validate on mount so markers appear before the author presses Save.
    void trigger()
  }, [trigger])

  function onSubmit() {
    // The resolver has already accepted the values. Write the document from here.
  }

  const hasError = validation?.result.markers.some((marker) => marker.level === 'error') ?? false
  // Save stays available once validation finished and no error markers remain.
  const accepted = validation != null && validation.result.status !== 'notEvaluated' && !hasError
  const warnings = validation?.result.markers.filter((marker) => marker.level === 'warning') ?? []
  const warning = (name: string) => warningFor(warnings, validation?.document, name)

  return (
    <form className="authoring" onSubmit={handleSubmit(onSubmit)} noValidate>
      <header className="doc-header">
        <div>
          <p className="doc-kicker">Product</p>
          <h2>{title?.trim() || 'Untitled product'}</h2>
        </div>
        <span className={`status-pill status-${status}`}>{status || 'draft'}</span>
      </header>

      <section className="doc-section">
        <h3>Details</h3>
        <Field label="Title" error={message(formState.errors.title)}>
          <input {...register('title')} />
        </Field>
        <div className="split">
          <Field label="SKU" error={message(formState.errors.sku)}>
            <input {...register('sku')} />
          </Field>
          <Field label="Status" error={message(formState.errors.status)}>
            <select {...register('status')}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="doc-section">
        <h3>Pricing</h3>
        <div className="split">
          <Field label="Price" error={message(formState.errors.price)}>
            <input type="number" step="0.01" {...register('price', {valueAsNumber: true})} />
          </Field>
          <Field label="Sale price" error={message(formState.errors.salePrice)} warning={warning('salePrice')}>
            <input type="number" step="0.01" {...register('salePrice', {valueAsNumber: true})} />
          </Field>
        </div>
      </section>

      <section className="doc-section">
        <h3>Classification</h3>
        <Field label="Category" error={message(formState.errors.categoryId)}>
          <input {...register('categoryId')} />
        </Field>
        <Field label="Tags" hint="Separate tags with commas" error={message(formState.errors.tags)}>
          <input {...register('tags')} placeholder="ceramic, blue" />
        </Field>
      </section>

      <section className="doc-section">
        <h3>SEO</h3>
        <Field label="Title" error={message(formState.errors.seo?.title)} warning={warning('seo.title')}>
          <input {...register('seo.title')} />
        </Field>
        <Field label="Description" error={message(formState.errors.seo?.description)} warning={warning('seo.description')}>
          <textarea {...register('seo.description')} rows={3} />
        </Field>
      </section>

      <section className="doc-section">
        <h3>Variants</h3>
        {variants.fields.map((field, index) => (
          <article className="variant" key={field.id}>
            <div className="variant-heading">
              <strong>Variant {index + 1}</strong>
              <button type="button" onClick={() => variants.remove(index)}>Remove</button>
            </div>
            <div className="split">
              <Field label="SKU" error={message(formState.errors.variants?.[index]?.sku)}>
                {/* Keep `_key` so variant marker paths can be turned into field indexes. */}
                <input type="hidden" {...register(`variants.${index}._key`)} />
                <input {...register(`variants.${index}.sku`)} />
              </Field>
              <Field label="Inventory" error={message(formState.errors.variants?.[index]?.inventory)}>
                <input type="number" {...register(`variants.${index}.inventory`, {valueAsNumber: true})} />
              </Field>
            </div>
          </article>
        ))}
        <button
          className="add-variant"
          type="button"
          onClick={() => variants.append({_key: `variant-${variants.fields.length + 1}`, sku: '', inventory: 0})}
        >
          Add variant
        </button>
      </section>

      <footer className="doc-footer">
        <div>
          {formState.errors.root?.message && <p className="error">{formState.errors.root.message}</p>}
          {validation && (
            <p className={validation.result.status === 'notEvaluated' ? 'incomplete' : accepted ? 'complete' : 'error'}>
              {validation.result.status === 'notEvaluated'
                ? 'Validation incomplete — do not save this document'
                : hasError
                  ? 'Resolve the marked fields before saving'
                  : 'Ready to save'}
            </p>
          )}
        </div>
        <button className="primary" type="submit" disabled={formState.isSubmitting || !accepted}>
          Save
        </button>
      </footer>
    </form>
  )
}

function toProductDocument(values: ProductFormValues): SanityDocument {
  const tags = values.tags.split(',').map((tag) => tag.trim()).filter(Boolean)

  return {
    _id: 'drafts.example-product',
    _type: 'product',
    // A stored document also has system fields. Validation only needs `_id` and the content.
    _createdAt: new Date(0).toISOString(),
    _updatedAt: new Date(0).toISOString(),
    _rev: '',
    title: values.title,
    sku: values.sku,
    status: values.status,
    price: finiteNumber(values.price),
    salePrice: finiteNumber(values.salePrice),
    // The input edits the referenced ID; the schema validates the reference object.
    category: values.categoryId ? {_type: 'reference', _ref: values.categoryId} : undefined,
    tags,
    seo: values.seo,
    variants: values.variants.map((variant) => ({
      ...variant,
      _type: 'variant',
      inventory: finiteNumber(variant.inventory),
    })),
  }
}

function finiteNumber(value: number) {
  // An empty number input is NaN. Leave it unset so required and min rules see a missing value.
  return Number.isFinite(value) ? value : undefined
}

/** Map schema paths onto the inputs, including fields whose form shape differs from the document. */
function formFieldName(path: Path, document: SanityDocument) {
  const name = markerFieldName(path, document)
  if (name === 'category' || name?.startsWith('category.')) return 'categoryId'
  if (name === 'tags' || name?.startsWith('tags.')) return 'tags'
  return name
}

function markersToFieldErrors(result: DocumentValidationResult, document: SanityDocument) {
  const errors: Record<string, unknown> = {}
  for (const marker of result.markers) {
    // Warnings stay out of the form errors and are rendered beside the field.
    if (marker.level !== 'error') continue
    assignFieldError(errors, formFieldName(marker.path, document) ?? 'root', marker.message)
  }
  // An incomplete run has no reliable markers, so block the whole form.
  if (result.status === 'notEvaluated') {
    assignFieldError(errors, 'root', 'Validation incomplete — do not save this document')
  }
  return errors as FieldErrors<ProductFormValues>
}

function assignFieldError(errors: Record<string, unknown>, name: string, message: string) {
  const parts = name.split('.')
  let current = errors
  for (let index = 0; index < parts.length - 1; index++) {
    const part = parts[index]
    const nextIsIndex = /^\d+$/.test(parts[index + 1])
    if (!current[part] || typeof current[part] !== 'object') current[part] = nextIsIndex ? [] : {}
    current = current[part] as Record<string, unknown>
  }
  const leaf = parts[parts.length - 1]
  const existing = current[leaf] as {message?: string} | undefined
  current[leaf] = {type: 'sanity', message: existing?.message ? `${existing.message} ${message}` : message}
}

function message(error: {message?: string} | undefined) {
  return error?.message
}

/** Find the warning whose schema path matches this input. */
function warningFor(
  warnings: DocumentValidationResult['markers'],
  document: SanityDocument | undefined,
  name: string,
) {
  if (!document) return undefined
  return warnings.find((marker) => markerFieldName(marker.path, document) === name)?.message
}

function Field({
  label,
  hint,
  error,
  warning,
  children,
}: {
  label: string
  hint?: string
  error?: string
  warning?: string
  children: ReactNode
}) {
  const tone = error ? 'error' : warning ? 'warning' : undefined

  return (
    <label className="field" data-tone={tone}>
      <span>{label}</span>
      {children}
      {hint && !error && !warning && <small className="hint">{hint}</small>}
      {error && <small className="error">{error}</small>}
      {warning && <small className="warning">{warning}</small>}
    </label>
  )
}
