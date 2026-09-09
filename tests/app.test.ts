import { describe, it, expect } from 'vitest'
import { app } from '../src/index.js'

describe('Hono Application Tests', () => {
  it('GET / should return 200 OK and Hello Hono!', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Hello Hono!')
  })

  it('GET /api/k8s/pods should return 200 OK and JSON pod status', async () => {
    const res = await app.request('/api/k8s/pods')
    expect(res.status).toBe(200)
    const data = await res.json() as { count: number; status: string }
    expect(data.count).toBeGreaterThanOrEqual(1)
    expect(data.status).toContain('Pods Active')
  })
})
