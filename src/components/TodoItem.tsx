import { useRef, useState } from 'react'
import type { SubmitEvent } from 'react'
import type { Todo, TodoUpdate } from '../types/todo'

interface Props {
  todo: Todo
  disabled: boolean
  onUpdate: (id: string, changes: TodoUpdate) => Promise<boolean>
  onRemove: (id: string) => Promise<boolean>
}

export function TodoItem({ todo, disabled, onUpdate, onRemove }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)
  const editButton = useRef<HTMLButtonElement>(null)
  function closeEditor() {
    setEditing(false)
    requestAnimationFrame(() => editButton.current?.focus())
  }
  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = draft.trim()
    if (title && (title === todo.title || await onUpdate(todo.id, { title }))) closeEditor()
  }
  return (
    <li className={`todo-item${todo.completed ? ' is-completed' : ''}`}>
      <input className="todo-checkbox" type="checkbox" checked={todo.completed} disabled={disabled || editing}
        aria-label={`${todo.completed ? 'Позначити активним' : 'Виконати'}: ${todo.title}`}
        onChange={() => { void onUpdate(todo.id, { completed: !todo.completed }) }} />
      {editing ? (
        <form className="edit-form" onSubmit={save}>
          <input autoFocus aria-label="Назва завдання" value={draft} maxLength={200}
            disabled={disabled} onChange={event => setDraft(event.target.value)}
            onKeyDown={event => { if (event.key === 'Escape' && !disabled) closeEditor() }} />
          <div className="edit-actions">
            <button type="submit" disabled={disabled || !draft.trim()}>Зберегти</button>
            <button type="button" disabled={disabled} onClick={closeEditor}>Скасувати</button>
          </div>
        </form>
      ) : (
        <>
          <div className="todo-copy">
            <span className="todo-title">{todo.title}</span>
            <span className="todo-date">{new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(new Date(todo.createdAt))}</span>
          </div>
          <div className="item-actions">
            <button ref={editButton} className="icon-button" type="button" title="Редагувати" aria-label={`Редагувати: ${todo.title}`}
              disabled={disabled} onClick={() => { setDraft(todo.title); setEditing(true) }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z" /></svg>
            </button>
            <button className="icon-button delete-button" type="button" title="Видалити" aria-label={`Видалити: ${todo.title}`}
              disabled={disabled} onClick={() => { void onRemove(todo.id) }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7m4-7v7" /></svg>
            </button>
          </div>
        </>
      )}
    </li>
  )
}
