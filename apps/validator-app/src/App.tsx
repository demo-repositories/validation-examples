import {useMemo, useState} from 'react'
import {SanityApp, useClient, type SanityConfig} from '@sanity/sdk-react'
import {validateDocument, type DocumentValidationResult, type ValidationClient, type ValidationSchema} from '@sanity/validation'
import {getValidationSchema} from '@validation-examples/content-schema'
import {ProductForm} from './ProductForm.js'
import './app.css'

const sample = {
  _id: 'drafts.example-product',
  _type: 'product',
  title: 'X',
  sku: 'MUG-0001',
  status: 'active',
  price: 10,
  salePrice: 20,
  category: {_type: 'reference', _ref: 'category-ceramics'},
  tags: [],
  seo: {title: 'A title that is valid enough to demonstrate a warning only'},
  variants: [
    {_key: 'one', _type: 'variant', sku: 'BLUE-0001', inventory: 1},
    {_key: 'two', _type: 'variant', sku: 'BLUE-0001', inventory: -1},
  ],
}

const projectId = process.env.SANITY_APP_PROJECT_ID
const dataset = process.env.SANITY_APP_DATASET

if (!projectId || !dataset) {
  throw new Error('Set SANITY_APP_PROJECT_ID and SANITY_APP_DATASET in the root .env file')
}

const config: SanityConfig[] = [{projectId, dataset}]

export default function App() {
  return (
    <SanityApp config={config} fallback={<p>Signing in…</p>}>
      <ValidationDemo />
    </SanityApp>
  )
}

function ValidationDemo() {
  const client = useClient({apiVersion: '2026-09-03'})
  const schema = useMemo(getValidationSchema, [])
  const [view, setView] = useState<'json' | 'form'>('json')

  return (
    <main>
      <h1>External validation</h1>
      <div className="views" role="tablist">
        <button type="button" role="tab" aria-selected={view === 'json'} onClick={() => setView('json')}>
          JSON document
        </button>
        <button type="button" role="tab" aria-selected={view === 'form'} onClick={() => setView('form')}>
          React Hook Form
        </button>
      </div>
      <div role="tabpanel">
        {view === 'json' ? <JsonValidation client={client} schema={schema} /> : <ProductForm client={client} schema={schema} />}
      </div>
    </main>
  )
}

function JsonValidation({client, schema}: {client: ValidationClient; schema: ValidationSchema}) {
  const [documentText, setDocumentText] = useState(JSON.stringify(sample, null, 2))
  const [result, setResult] = useState<DocumentValidationResult | null>(null)

  async function validate() {
    try {
      const document = JSON.parse(documentText)
      setResult(await validateDocument({document, schema, client}))
    } catch (error) {
      setResult({
        status: 'failed',
        markers: [{
          code: 'validation.exception',
          level: 'error',
          message: error instanceof Error ? error.message : String(error),
          path: [],
        }],
      })
    }
  }

  return (
    <div className="json-view">
      <p>
        This view passes the signed-in client and the shared compiled schema to <code>validateDocument</code>.
      </p>
      <textarea value={documentText} onChange={(event) => setDocumentText(event.target.value)} rows={20} />
      <button onClick={validate}>Validate document</button>
      {result && (
        <section>
          <p className={result.status === 'notEvaluated' ? 'incomplete' : 'complete'}>
            {result.status === 'notEvaluated'
              ? 'Validation incomplete — do not treat this as valid'
              : `Validation ${result.status}`}
          </p>
          <ul>
            {result.markers.map((marker, index) => (
              <li key={`${marker.message}-${index}`} className={marker.level}>
                <strong>{marker.level}</strong> {marker.message}{' '}
                <code>{JSON.stringify(marker.path)}</code>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
