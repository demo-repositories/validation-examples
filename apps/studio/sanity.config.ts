import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from '@validation-examples/content-schema'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET

if (!projectId || !dataset) {
  throw new Error('Set SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET in the root .env file')
}

export default defineConfig({
  name: 'default',
  title: 'Validation examples',
  projectId,
  dataset,
  schema: { types: schemaTypes },
  plugins: [structureTool()], // Add the desk tool plugin 
})
