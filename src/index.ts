import { Hono } from 'hono'
import { serve } from '@hono/node-server'

export const app = new Hono()

app.get('/', (c) => c.text('Hello Hono!'))

const port = 3000

/* v8 ignore start */
if (process.env.NODE_ENV !== 'test') {
  console.log(`Server is running on port ${port}`)
  serve({
    fetch: app.fetch,
    port
  })
}
/* v8 ignore stop */
