export interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

export type TodoUpdate = Partial<Pick<Todo, 'title' | 'completed'>>
export type TodoFilter = 'all' | 'active' | 'completed'
