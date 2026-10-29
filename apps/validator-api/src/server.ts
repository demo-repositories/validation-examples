import {loadEnvFile} from 'node:process'
import {fileURLToPath} from 'node:url'
import {createClient} from '@sanity/client'
import {createValidationApp} from './app.js'

loadEnvFile(fileURLToPath(new URL('../../../.env', import.meta.url)))

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET
const token = process.env.SANITY_API_READ_TOKEN

if (!projectId || !dataset || !token) {
  throw new Error('Set SANITY_PROJECT_ID, SANITY_DATASET, and SANITY_API_READ_TOKEN')
}

const client = createClient({
  projectId,
  dataset,
  token,
  // Same API version custom validators pass to context.getClient().
  apiVersion: '2026-09-03',
  // Validators read the current dataset. A CDN response can make a SKU look unique when it is not.
  useCdn: false,
})

const port = Number(process.env.PORT ?? 3001)
createValidationApp(client).listen(port, () => {
  console.log(`Validation API listening on http://localhost:${port}`)
})
