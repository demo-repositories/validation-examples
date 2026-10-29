import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from '@validation-examples/content-schema'

export default defineConfig({
  name: 'default',
  title: 'Validation examples',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'kan3dut8',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'validation',
  schema: { types: schemaTypes },
  plugins: [structureTool()], // Add the desk tool plugin 
})
