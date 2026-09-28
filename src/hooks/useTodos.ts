import { useCallback, useEffect, useRef, useState } from 'react'
import { createTodo, deleteTodo, getApiError, getTodos, updateTodo } from '../api/todos'
import type { Todo, TodoUpdate } from '../types/todo'

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const controller = useRef<AbortController | null>(null)

  const load = useCallback(() => {
    if (busy.current) return
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    void getTodos(request.signal)
      .then(result => {
        if (!request.signal.aborted) setTodos(result)
      })
      .catch((error: unknown) => {
        if (!request.signal.aborted) setLoadError(getApiError(error))
      })
      .finally(() => {
        if (!request.signal.aborted) setLoading(false)
      })
  }, [])

  useEffect(() => {
    void load()
    return () => controller.current?.abort()
  }, [load])

  function reload() {
    if (busy.current) return
    setLoading(true)
    setLoadError(null)
    setActionError(null)
    void load()
  }

  async function mutate(operation: () => Promise<void>): Promise<boolean> {
    if (busy.current || loading || loadError) return false
    busy.current = true
    setPending(true)
    setActionError(null)
    try {
      await operation()
      return true
    } catch (error) {
      setActionError(getApiError(error))
      return false
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  function add(title: string) {
    return mutate(async () => {
      const todo = await createTodo(title)
      setTodos(current => [todo, ...current])
    })
  }

  function update(id: string, changes: TodoUpdate) {
    return mutate(async () => {
      const todo = await updateTodo(id, changes)
      setTodos(current => current.map(item => item.id === id ? todo : item))
    })
  }

  function remove(id: string) {
    return mutate(async () => {
      await deleteTodo(id)
      setTodos(current => current.filter(item => item.id !== id))
    })
  }

  return { todos, loading, loadError, actionError, pending, reload, add, update, remove }
}
