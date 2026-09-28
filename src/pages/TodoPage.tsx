import { useState } from 'react'
import { TodoForm } from '../components/TodoForm'
import { TodoItem } from '../components/TodoItem'
import { useTodos } from '../hooks/useTodos'
import type { TodoFilter } from '../types/todo'

const filters: { value: TodoFilter; label: string }[] = [
  { value: 'all', label: 'Усі' }, { value: 'active', label: 'Активні' }, { value: 'completed', label: 'Виконані' },
]

export function TodoPage() {
  const { todos, loading, loadError, actionError, pending, reload, add, update, remove } = useTodos()
  const [filter, setFilter] = useState<TodoFilter>('all')
  const active = todos.filter(todo => !todo.completed).length
  const completed = todos.length - active
  const visible = todos.filter(todo => filter === 'all' || (filter === 'completed' ? todo.completed : !todo.completed))
  const disabled = loading || !!loadError || pending
  const ready = !loading && !loadError

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="./"><span className="brand-mark" aria-hidden="true">✓</span>todo<span className="brand-dot">.</span></a>
        <span className="header-note">Менше хаосу. Більше простору.</span>
      </header>
      <main>
        <section className="intro" aria-labelledby="page-title">
          <div className="eyebrow"><span /> ТВІЙ ЩОДЕННИЙ ФОКУС</div>
          <h1 id="page-title">Великі плани.<br /><span>Маленькі кроки.</span></h1>
          <p>Звільни думки — запиши справи.<br className="mobile-break" /> Рухайся у власному темпі.</p>
        </section>
        <section className="todo-panel" aria-label="Завдання">
          <div className="panel-top">
            <div><h2>Мої завдання</h2><p>Кожна завершена справа — крок уперед.</p></div>
            <span className="count-badge" aria-label="Усього завдань">{ready ? todos.length : '—'}</span>
          </div>
          <TodoForm disabled={disabled} onAdd={async title => {
            const success = await add(title)
            if (success) setFilter('all')
            return success
          }} />
          <div className="list-toolbar">
            <div className="filters" role="group" aria-label="Фільтр завдань">
              {filters.map(item => <button key={item.value} type="button" aria-pressed={filter === item.value}
                className={filter === item.value ? 'selected' : ''} onClick={() => setFilter(item.value)}>
                {item.label}
              </button>)}
            </div>
            <span className="active-count" aria-live="polite">{ready ? `Активних: ${active}` : 'Активних: —'}</span>
          </div>
          {actionError && <div className="action-error" role="alert">{actionError} Зміни не підтверджено. Спробуйте дію повторно або <button type="button" onClick={() => { void reload() }}>оновіть список</button>.</div>}
          <div className="list-area" aria-busy={loading || pending}>
            {loading ? <div className="empty-state" role="status"><span className="spinner" /><h3>Завантажуємо завдання…</h3><p>Ще мить — і можна починати.</p></div>
              : loadError ? <div className="empty-state error-state" role="alert"><span className="state-icon" aria-hidden="true">!</span><h3>Не вдалося завантажити справи</h3><p>{loadError}</p><button className="secondary-button" type="button" onClick={() => { void reload() }}>Спробувати ще раз</button></div>
              : visible.length ? <ul className="todo-list">{visible.map(todo => <TodoItem key={todo.id} todo={todo} disabled={pending} onUpdate={update} onRemove={remove} />)}</ul>
              : <div className="empty-state"><span className="state-icon" aria-hidden="true">✓</span>
                <h3>{filter === 'completed' ? 'Усе ще попереду' : filter === 'active' && todos.length ? 'Усі справи завершено!' : 'Тут є місце для твоїх планів'}</h3>
                <p>{filter === 'completed' ? 'Виконані завдання з’являться тут.' : filter === 'active' && todos.length ? 'Час видихнути й потішити себе.' : 'Додай перше завдання — почни з малого.'}</p>
              </div>}
          </div>
          <footer className="panel-footer"><span>{pending ? 'Зберігаємо зміни…' : 'Одна справа за раз.'}</span><span>{ready ? `Виконано ${completed} із ${todos.length}` : 'Твій темп має значення'}</span></footer>
        </section>
        <p className="closing-note"><span aria-hidden="true">✦</span> Не потрібно встигати все. Почни з важливого.</p>
      </main>
      <footer className="site-footer"><span>Трохи більше порядку щодня.</span><span>Зроблено для твого спокою</span></footer>
    </div>
  )
}
