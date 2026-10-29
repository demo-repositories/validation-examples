import {loadEnvFile} from 'node:process'
import {fileURLToPath} from 'node:url'
import {defineCliConfig} from 'sanity/cli'

// The CLI loads .env from this directory. This example keeps one file at the repo root.
loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)))

const organizationId = process.env.SANITY_APP_ORGANIZATION_ID

if (!organizationId) {
  throw new Error('Set SANITY_APP_ORGANIZATION_ID in the root .env file')
}

export default defineCliConfig({
  app: {
    organizationId,
    entry: './src/App.tsx',
  },
})
