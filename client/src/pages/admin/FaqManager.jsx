import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/apiClient';

const empty = { categoria: 'general', pregunta: '', respuesta: '', orden: 0, imagen_url: '' };

export default function FaqManager() {
  const { negocioId } = useParams();
  const [items, setItems] = useState([]);
  const [nuevo, setNuevo] = useState(empty);
  const [error, setError] = useState('');

  const load = () => api.get(`/admin/negocios/${negocioId}/faq`).then(setItems).catch((e) => setError(e.message));

  useEffect(() => { load(); }, [negocioId]);

  const onChange = (id, field, value) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const onSave = async (item) => {
    await api.put(`/admin/faq/${item.id}`, item);
    load();
  };

  const onDelete = async (id) => {
    await api.delete(`/admin/faq/${id}`);
    load();
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/admin/negocios/${negocioId}/faq`, nuevo);
      setNuevo(empty);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Preguntas frecuentes (FAQ)</h1>
      <p style={{ color: '#9aa1ad' }}>
        El agente de IA solo responde con lo que está aquí. Para cambiar el negocio de giro
        (ej. de tacos a azulejos) basta con reemplazar estas filas.
      </p>

      {items.map((item) => (
        <div className="faq-row" key={item.id}>
          <input value={item.categoria} onChange={(e) => onChange(item.id, 'categoria', e.target.value)} placeholder="categoría" />
          <input value={item.pregunta} onChange={(e) => onChange(item.id, 'pregunta', e.target.value)} placeholder="pregunta" />
          <textarea value={item.respuesta} onChange={(e) => onChange(item.id, 'respuesta', e.target.value)} rows={3} />
          <input
            value={item.imagen_url || ''}
            onChange={(e) => onChange(item.id, 'imagen_url', e.target.value)}
            placeholder="URL de imagen (opcional, ej. para ítems de menú)"
          />
          <label style={{ fontSize: '0.85rem', color: '#9aa1ad' }}>
            <input
              type="checkbox"
              checked={item.activo}
              onChange={(e) => onChange(item.id, 'activo', e.target.checked)}
              style={{ width: 'auto', marginRight: '0.4rem' }}
            />
            Activo
          </label>
          <div className="faq-row-actions">
            <button className="secondary" onClick={() => onSave(item)}>Guardar</button>
            <button className="danger" onClick={() => onDelete(item.id)}>Eliminar</button>
          </div>
        </div>
      ))}

      <h2 style={{ marginTop: '2rem' }}>Agregar nueva</h2>
      <form onSubmit={onCreate} className="faq-row">
        <input value={nuevo.categoria} onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })} placeholder="categoría" />
        <input value={nuevo.pregunta} onChange={(e) => setNuevo({ ...nuevo, pregunta: e.target.value })} placeholder="pregunta" required />
        <textarea value={nuevo.respuesta} onChange={(e) => setNuevo({ ...nuevo, respuesta: e.target.value })} placeholder="respuesta" rows={3} required />
        <input
          value={nuevo.imagen_url}
          onChange={(e) => setNuevo({ ...nuevo, imagen_url: e.target.value })}
          placeholder="URL de imagen (opcional, ej. para ítems de menú)"
        />
        {error && <p className="error-msg">{error}</p>}
        <button type="submit">Agregar</button>
      </form>
    </div>
  );
}
