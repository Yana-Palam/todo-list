import { useState } from 'react'
import type { SubmitEvent } from 'react'

interface Props {
  disabled: boolean
  onAdd: (title: string) => Promise<boolean>
}

export function TodoForm({ disabled, onAdd }: Props) {
  const [title, setTitle] = useState('')
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = title.trim()
    if (trimmed && await onAdd(trimmed)) setTitle('')
  }
  return (
    <form className="add-form" onSubmit={submit}>
      <label className="sr-only" htmlFor="new-todo">Нове завдання</label>
      <span className="add-symbol" aria-hidden="true">＋</span>
      <input id="new-todo" placeholder="Що потрібно зробити?" value={title}
        onChange={event => setTitle(event.target.value)} maxLength={200} disabled={disabled} />
      <button className="primary-button" disabled={disabled || !title.trim()} type="submit">Додати <span aria-hidden="true">↗</span></button>
    </form>
  )
}
