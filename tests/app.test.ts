import { describe, it, expect } from 'vitest'
import { app } from '../src/index.js'

describe('Hono Application Tests', () => {
  it('GET / should return 200 OK and Hello Hono!', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Hello Hono!')
  })
})
