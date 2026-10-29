import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'kan3dut8',
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'validation',
  },
})
