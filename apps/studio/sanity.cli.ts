import {loadEnvFile} from 'node:process'
import {fileURLToPath} from 'node:url'
import {defineCliConfig} from 'sanity/cli'

// The CLI loads .env from this directory. This example keeps one file at the repo root.
loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)))

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET

if (!projectId || !dataset) {
  throw new Error('Set SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET in the root .env file')
}

export default defineCliConfig({
  api: {projectId, dataset},
})
