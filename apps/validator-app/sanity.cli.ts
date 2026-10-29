import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  app: {
    organizationId: process.env.SANITY_APP_ORGANIZATION_ID ?? 'ofXDcF8Tu',
    entry: './src/App.tsx',
  },
})
