import React, { useEffect, useState } from 'react';
import { fetchItems, createItem, updateItem, deleteItem } from './api';
import './index.css';

function ItemForm({ type, onSaved }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('Title required');
    try {
      await createItem({ type, title: title.trim(), content: content.trim() });
      setTitle(''); setContent('');
      onSaved();
    } catch (err) {
      alert(err.error || err.message || 'Failed to create');
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="form-row">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder={type === 'todo' ? 'Todo title' : 'Note title'} />
      </div>
      <div className="form-row">
        <textarea value={content} onChange={e => setContent(e.target.value)} rows="3" placeholder={type === 'todo' ? 'Optional description' : 'Note content'} />
      </div>
      <div>
        <button type="submit">{type === 'todo' ? 'Add Todo' : 'Add Note'}</button>
      </div>
    </form>
  );
}

function ItemList({ type, refreshKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchItems({ type });
      setItems(data.data || []);
    } catch (err) {
      console.error(err);
      alert(err.error || err.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshKey]);

  const toggleComplete = async (item) => {
    try {
      await updateItem(item._id, { completed: !item.completed });
      load();
    } catch (err) {
      alert(err.error || err.message || 'Failed to update');
    }
  };

  const remove = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await deleteItem(itemId);
      load();
    } catch (err) {
      alert(err.error || err.message || 'Failed to delete');
    }
  };

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      {items.length === 0 ? <div className="small-muted">No {type}s yet</div> : null}
      {items.map(it => (
        <div key={it._id} className="item">
          <div>
            <div style={{ fontWeight: 600 }}>{it.title} {type === 'todo' && it.completed ? <span className="small-muted"> (done)</span> : null}</div>
            {it.content ? <div className="small-muted">{it.content}</div> : null}
            <div className="small-muted">Created: {new Date(it.createdAt).toLocaleString()}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {type === 'todo' && (
              <button onClick={() => toggleComplete(it)}>{it.completed ? 'Undo' : 'Done'}</button>
            )}
            <button onClick={() => remove(it._id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="container">
      <div className="header">
        <h2>ToDoEase</h2>
      </div>

      <div className="grid">
        <div>
          <h3>Todos</h3>
          <ItemForm type="todo" onSaved={() => setRefreshKey(k => k + 1)} />
          <ItemList type="todo" refreshKey={refreshKey} />
        </div>

        <div>
          <h3>Notes</h3>
          <ItemForm type="note" onSaved={() => setRefreshKey(k => k + 1)} />
          <ItemList type="note" refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}
