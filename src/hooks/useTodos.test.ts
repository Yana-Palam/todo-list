// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createTodo, deleteTodo, getTodos, updateTodo } from '../api/todos'
import type { Todo } from '../types/todo'
import { useTodos } from './useTodos'

vi.mock('../api/todos', () => ({
  getTodos: vi.fn(), createTodo: vi.fn(), updateTodo: vi.fn(), deleteTodo: vi.fn(),
  getApiError: (error: unknown) => error instanceof Error ? error.message : 'Помилка',
}))

const todo: Todo = { id: '1', title: 'Завдання', completed: false, createdAt: '2026-10-05T10:00:00.000Z' }
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
beforeEach(() => vi.resetAllMocks())
afterEach(() => cleanup())

it('loads, reports an error, blocks mutations and retries', async () => {
  vi.mocked(getTodos).mockRejectedValueOnce(new Error('Недоступно')).mockResolvedValueOnce([todo])
  const { result } = renderHook(useTodos)
  expect(result.current.loading).toBe(true)
  await waitFor(() => expect(result.current.loadError).toBe('Недоступно'))
  expect(result.current.loading).toBe(false)
  await act(async () => { expect(await result.current.add('new')).toBe(false) })
  expect(createTodo).not.toHaveBeenCalled()
  act(() => result.current.reload())
  await waitFor(() => expect(result.current.todos).toEqual([todo]))
  expect(result.current.loadError).toBeNull()
})

it('waits for server confirmation and blocks duplicate operations', async () => {
  vi.mocked(getTodos).mockResolvedValue([])
  const request = deferred<Todo>()
  vi.mocked(createTodo).mockReturnValue(request.promise)
  const { result } = renderHook(useTodos)
  await waitFor(() => expect(result.current.loading).toBe(false))
  let adding!: Promise<boolean>
  act(() => { adding = result.current.add(todo.title) })
  expect(result.current.pending).toBe(true)
  expect(result.current.todos).toEqual([])
  await act(async () => { expect(await result.current.remove('1')).toBe(false) })
  expect(deleteTodo).not.toHaveBeenCalled()
  await act(async () => { request.resolve(todo); expect(await adding).toBe(true) })
  expect(result.current.todos).toEqual([todo])
  expect(result.current.pending).toBe(false)
})

it('preserves records on mutation failure, then updates and deletes', async () => {
  vi.mocked(getTodos).mockResolvedValue([todo])
  vi.mocked(updateTodo).mockRejectedValueOnce(new Error('Не збережено')).mockResolvedValueOnce({ ...todo, completed: true })
  vi.mocked(deleteTodo).mockResolvedValue(undefined)
  const { result } = renderHook(useTodos)
  await waitFor(() => expect(result.current.loading).toBe(false))
  await act(async () => { expect(await result.current.update('1', { completed: true })).toBe(false) })
  expect(result.current.todos).toEqual([todo])
  expect(result.current.actionError).toBe('Не збережено')
  expect(result.current.pending).toBe(false)
  await act(async () => { expect(await result.current.update('1', { completed: true })).toBe(true) })
  expect(result.current.todos[0].completed).toBe(true)
  expect(result.current.actionError).toBeNull()
  await act(async () => { expect(await result.current.remove('1')).toBe(true) })
  expect(result.current.todos).toEqual([])
})

it('aborts old GET requests, ignores stale responses and aborts on unmount', async () => {
  const old = deferred<Todo[]>()
  const current = deferred<Todo[]>()
  vi.mocked(getTodos).mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise)
  const { result, unmount } = renderHook(useTodos)
  const oldSignal = vi.mocked(getTodos).mock.calls[0][0]
  act(() => result.current.reload())
  expect(oldSignal?.aborted).toBe(true)
  await act(async () => { current.resolve([todo]); await current.promise })
  await act(async () => { old.resolve([]); await old.promise })
  expect(result.current.todos).toEqual([todo])
  expect(result.current.loading).toBe(false)
  unmount()
  expect(vi.mocked(getTodos).mock.calls[1][0]?.aborted).toBe(true)
})
