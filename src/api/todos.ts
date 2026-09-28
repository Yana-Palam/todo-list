import axios from 'axios'
import { apiClient } from './client'
import type { Todo, TodoUpdate } from '../types/todo'

export const TODOS_ENDPOINT = '/todos'

function parseTodo(value: unknown): Todo {
  if (typeof value !== 'object' || value === null ||
      !('id' in value) || typeof value.id !== 'string' ||
      !('title' in value) || typeof value.title !== 'string' ||
      !('completed' in value) || typeof value.completed !== 'boolean' ||
      !('createdAt' in value) || typeof value.createdAt !== 'string' ||
      !Number.isFinite(Date.parse(value.createdAt))) {
    throw new Error('API повернув некоректне завдання. Перевірте поля id, title, completed та createdAt.')
  }
  return { id: value.id, title: value.title, completed: value.completed, createdAt: value.createdAt }
}

export async function getTodos(signal?: AbortSignal): Promise<Todo[]> {
  const { data } = await apiClient.get<unknown>(TODOS_ENDPOINT, { signal })
  if (!Array.isArray(data)) throw new Error('API повернув некоректний список завдань.')
  return data.map(parseTodo)
}

export async function createTodo(title: string): Promise<Todo> {
  const { data } = await apiClient.post<unknown>(TODOS_ENDPOINT, {
    title, completed: false, createdAt: new Date().toISOString(),
  })
  return parseTodo(data)
}

export async function updateTodo(id: string, changes: TodoUpdate): Promise<Todo> {
  // MockAPI.io does not allow PATCH in browser CORS preflight responses.
  const { data } = await apiClient.put<unknown>(`${TODOS_ENDPOINT}/${encodeURIComponent(id)}`, changes)
  return parseTodo(data)
}

export async function deleteTodo(id: string): Promise<void> {
  await apiClient.delete(`${TODOS_ENDPOINT}/${encodeURIComponent(id)}`)
}

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) return 'Ресурс todos не знайдено. Перевірте адресу API та наявність ресурсу в MockAPI.io.'
    if (error.code === 'ECONNABORTED') return 'Сервер не відповів вчасно. Спробуйте ще раз.'
    return 'Не вдалося виконати запит. Перевірте з’єднання та спробуйте ще раз.'
  }
  return error instanceof Error ? error.message : 'Сталася невідома помилка. Спробуйте ще раз.'
}
