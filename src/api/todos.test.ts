import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './client'
import { createTodo, deleteTodo, getTodos, updateTodo } from './todos'

const todo = { id: '1', title: 'Завдання', completed: false, createdAt: '2026-10-05T10:00:00.000Z' }

afterEach(() => vi.restoreAllMocks())

describe('API contract', () => {
  it('accepts valid and empty lists and forwards the abort signal', async () => {
    const signal = new AbortController().signal
    const get = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: [todo] }).mockResolvedValueOnce({ data: [] })
    expect(await getTodos(signal)).toEqual([todo])
    expect(get).toHaveBeenCalledWith('/todos', { signal })
    expect(await getTodos()).toEqual([])
  })

  it.each([null, {}, 'invalid', [null], [{ ...todo, id: 1 }], [{ ...todo, title: null }],
    [{ ...todo, completed: 'false' }], [{ ...todo, createdAt: 'invalid' }], [{ id: '1' }]])(
    'rejects malformed response %j', async data => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data })
      await expect(getTodos()).rejects.toThrow('API повернув некоректн')
    },
  )

  it('creates with defaults and validates the returned record', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: todo }).mockResolvedValueOnce({ data: null })
    expect(await createTodo(todo.title)).toEqual(todo)
    expect(post).toHaveBeenCalledWith('/todos', {
      title: todo.title, completed: false, createdAt: expect.any(String),
    })
    const body: unknown = post.mock.calls[0][1]
    if (typeof body !== 'object' || body === null || !('createdAt' in body) || typeof body.createdAt !== 'string') {
      throw new Error('Missing creation date')
    }
    expect(Number.isFinite(Date.parse(body.createdAt))).toBe(true)
    await expect(createTodo(todo.title)).rejects.toThrow('некоректне завдання')
  })

  it('uses PUT and DELETE with an encoded id', async () => {
    const put = vi.spyOn(apiClient, 'put').mockResolvedValueOnce({ data: todo }).mockResolvedValueOnce({ data: {} })
    const remove = vi.spyOn(apiClient, 'delete').mockResolvedValue({ data: {} })
    await updateTodo('a/b ?', { completed: true })
    expect(put).toHaveBeenCalledWith('/todos/a%2Fb%20%3F', { completed: true })
    await expect(updateTodo('1', { title: 'new' })).rejects.toThrow('некоректне завдання')
    await deleteTodo('a/b ?')
    expect(remove).toHaveBeenCalledWith('/todos/a%2Fb%20%3F')
  })

  it('rejects missing baseURL before sending a request', async () => {
    const adapter = vi.fn()
    await expect(apiClient.get('/todos', { baseURL: '', adapter })).rejects.toThrow('VITE_API_BASE_URL')
    expect(adapter).not.toHaveBeenCalled()
  })
})
