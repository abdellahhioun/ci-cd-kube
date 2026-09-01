import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'

export const app = new Hono()

app.use('/dashboard/*', serveStatic({ root: './' }))
app.get('/dashboard', serveStatic({ path: './dashboard/index.html' }))

app.get('/', (c) => c.text('Hello Hono!'))

const port = 3000

/* v8 ignore start */
if (process.env.NODE_ENV !== 'test') {
  console.log(`Server is running on port ${port}`)
  console.log(`Live CI/CD Dashboard available at http://localhost:${port}/dashboard`)
  serve({
    fetch: app.fetch,
    port
  })
}
/* v8 ignore stop */
