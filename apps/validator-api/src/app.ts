import express from 'express'
import {validateDocument, validateDocuments} from '@sanity/validation'
import {getValidationSchema} from '@validation-examples/content-schema'

function responseFor(result: {status: string; markers: Array<{level: string}>}) {
  // `passed` means the run finished with no markers. A warning is a marker, so it is not a pass.
  // `notEvaluated` means a rule that needs the client never ran.
  const valid = result.status === 'passed' && !result.markers.some((marker) => marker.level === 'error')
  return {valid, ...result}
}

export function createValidationApp(client: any): express.Express {
  const app = express()
  const schema = getValidationSchema()

  app.use(express.json())

  app.post('/validate', async (request, response, next) => {
    try {
      // The client lets reference checks and getClient() validators run.
      const result = responseFor(
        await validateDocument({document: request.body.document, schema, client}),
      )
      response.status(result.valid ? 200 : 422).json(result)
    } catch (error) {
      next(error)
    }
  })

  app.post('/validate/batch', async (request, response, next) => {
    try {
      // One call shares reference-existence batching and the fetch concurrency limit.
      const results = await validateDocuments({
        documents: request.body.documents,
        schema,
        client,
      })
      const body = results.map(responseFor)
      response.status(body.every((result) => result.valid) ? 200 : 422).json(body)
    } catch (error) {
      next(error)
    }
  })

  app.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    response.status(500).json({error: error.message})
  })

  return app
}
