import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/apiClient';

const ESTADOS_PEDIDO = ['Nuevo', 'En proceso', 'Completado'];
const ESTADOS_CITA = ['Nueva', 'Confirmada', 'Completada', 'Cancelada'];
const ESTADOS_RESERVA = ['Nueva', 'Confirmada', 'Completada', 'Cancelada'];

function PedidosModal({ solicitudId, onClose }) {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const load = () =>
    api.get(`/admin/solicitudes/${solicitudId}/pedidos`)
      .then(setPedidos)
      .catch(() => setPedidos([]))
      .finally(() => setCargando(false));

  useEffect(() => { load(); }, [solicitudId]);

  const cambiarEstado = async (pedido, estado) => {
    await api.put(`/admin/pedidos/${pedido.id}`, { estado });
    load();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-box-close" onClick={onClose}>✕</button>
        <h2>Historial de pedidos</h2>
        {cargando && <p style={{ color: '#9aa1ad' }}>Cargando…</p>}
        {!cargando && pedidos.length === 0 && (
          <p style={{ color: '#9aa1ad' }}>Este contacto todavía no ha hecho un pedido desde el menú interactivo.</p>
        )}
        {pedidos.map((p) => (
          <div className="faq-row" key={p.id}>
            <strong>Pedido #{p.id} · {p.tipo_entrega === 'domicilio' ? 'A domicilio' : 'Pasar por él'}</strong>
            <span style={{ color: '#9aa1ad' }}>{new Date(p.creado_en).toLocaleString('es-MX')}</span>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.1rem' }}>
              {(Array.isArray(p.items) ? p.items : []).map((it, i) => (
                <li key={i}>
                  <strong>{it.nombre}</strong>{it.detalle ? ` — ${it.detalle}` : ''}
                </li>
              ))}
            </ul>
            <div className="field">
              <label>Estatus del pedido</label>
              <select value={p.estado} onChange={(e) => cambiarEstado(p, e.target.value)}>
                {ESTADOS_PEDIDO.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CitasModal({ solicitudId, onClose }) {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const load = () =>
    api.get(`/admin/solicitudes/${solicitudId}/citas`)
      .then(setCitas)
      .catch(() => setCitas([]))
      .finally(() => setCargando(false));

  useEffect(() => { load(); }, [solicitudId]);

  const cambiarEstado = async (cita, estado) => {
    await api.put(`/admin/citas/${cita.id}`, { estado });
    load();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-box-close" onClick={onClose}>✕</button>
        <h2>Historial de citas</h2>
        {cargando && <p style={{ color: '#9aa1ad' }}>Cargando…</p>}
        {!cargando && citas.length === 0 && (
          <p style={{ color: '#9aa1ad' }}>Este contacto todavía no ha agendado una cita desde la agenda interactiva.</p>
        )}
        {citas.map((c) => (
          <div className="faq-row" key={c.id}>
            <strong>Cita #{c.id} · {c.servicio || 'Servicio sin especificar'}</strong>
            <span style={{ color: '#9aa1ad' }}>
              {c.nombre_cliente || 'Sin nombre'} · {c.fecha || '—'} {c.horario || ''}
            </span>
            <span style={{ color: '#9aa1ad', fontSize: '0.8rem' }}>Solicitada: {new Date(c.creado_en).toLocaleString('es-MX')}</span>
            <div className="field">
              <label>Estatus de la cita</label>
              <select value={c.estado} onChange={(e) => cambiarEstado(c, e.target.value)}>
                {ESTADOS_CITA.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReservasModal({ solicitudId, onClose }) {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const load = () =>
    api.get(`/admin/solicitudes/${solicitudId}/reservas`)
      .then(setReservas)
      .catch(() => setReservas([]))
      .finally(() => setCargando(false));

  useEffect(() => { load(); }, [solicitudId]);

  const cambiarEstado = async (reserva, estado) => {
    await api.put(`/admin/reservas/${reserva.id}`, { estado });
    load();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-box-close" onClick={onClose}>✕</button>
        <h2>Historial de reservas</h2>
        {cargando && <p style={{ color: '#9aa1ad' }}>Cargando…</p>}
        {!cargando && reservas.length === 0 && (
          <p style={{ color: '#9aa1ad' }}>Este contacto todavía no ha reservado mesa por WhatsApp.</p>
        )}
        {reservas.map((r) => (
          <div className="faq-row" key={r.id}>
            <strong>Reserva #{r.id} · {r.personas || '?'} personas</strong>
            <span style={{ color: '#9aa1ad' }}>
              {r.nombre_cliente || 'Sin nombre'} · {r.fecha || '—'} {r.horario || ''}
            </span>
            <span style={{ color: '#9aa1ad', fontSize: '0.8rem' }}>Solicitada: {new Date(r.creado_en).toLocaleString('es-MX')}</span>
            <div className="field">
              <label>Estatus de la reserva</label>
              <select value={r.estado} onChange={(e) => cambiarEstado(r, e.target.value)}>
                {ESTADOS_RESERVA.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SolicitudRow({ item, onUpdated }) {
  const [motivo, setMotivo] = useState('');
  const [pedidosAbierto, setPedidosAbierto] = useState(false);
  const [citasAbierto, setCitasAbierto] = useState(false);
  const [reservasAbierto, setReservasAbierto] = useState(false);
  const estaBaneado = item.estado === 'Baneado';

  const toggleBot = async () => {
    await api.put(`/admin/solicitudes/${item.id}`, { bot_bloqueado: !item.bot_bloqueado });
    onUpdated();
  };

  const banear = async () => {
    await api.put(`/admin/solicitudes/${item.id}`, {
      bot_bloqueado: true,
      estado: 'Baneado',
      motivo_baneo: motivo || 'Sin motivo especificado',
    });
    onUpdated();
  };

  const desbanear = async () => {
    await api.put(`/admin/solicitudes/${item.id}`, {
      bot_bloqueado: false,
      estado: 'Atendido',
      motivo_baneo: '',
    });
    onUpdated();
  };

  const marcarAtendido = async () => {
    await api.put(`/admin/solicitudes/${item.id}`, { leido: true });
    onUpdated();
  };

  return (
    <div className="faq-row">
      <strong>
        {item.nombre_contacto || item.telefono} {estaBaneado && <span className="badge-baneado">Baneado</span>}
        {!item.leido && <span className="badge-atencion">Requiere atención</span>}
      </strong>
      <span style={{ color: '#9aa1ad' }}>{item.telefono} · {item.canal} · {item.estado}</span>
      <p>{item.ultimo_mensaje}</p>
      {estaBaneado && item.motivo_baneo && <p className="error-msg">Motivo del baneo: {item.motivo_baneo}</p>}

      <div className="faq-row-actions">
        <button className="secondary" onClick={toggleBot}>
          {item.bot_bloqueado ? 'Reactivar bot' : 'Pausar bot (tomar yo la conversación)'}
        </button>
        {!item.leido && (
          <button className="secondary" onClick={marcarAtendido}>Marcar como atendido</button>
        )}
      </div>

      <div className="faq-row-actions">
        <button className="secondary" onClick={() => setPedidosAbierto(true)}>
          Historial de pedidos{item.pedidos_nuevos > 0 && <span className="badge-notificacion">{item.pedidos_nuevos}</span>}
        </button>
        <button className="secondary" onClick={() => setCitasAbierto(true)}>
          Historial de citas{item.citas_nuevas > 0 && <span className="badge-notificacion">{item.citas_nuevas}</span>}
        </button>
        <button className="secondary" onClick={() => setReservasAbierto(true)}>
          Historial de reservas{item.reservas_nuevas > 0 && <span className="badge-notificacion">{item.reservas_nuevas}</span>}
        </button>
      </div>

      {estaBaneado ? (
        <div className="faq-row-actions">
          <button className="danger" onClick={desbanear}>Quitar baneo</button>
        </div>
      ) : (
        <div className="ban-row">
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo del baneo (ej. pedido falso a domicilio)"
          />
          <button className="danger" onClick={banear}>Banear número</button>
        </div>
      )}

      {pedidosAbierto && (
        <PedidosModal solicitudId={item.id} onClose={() => setPedidosAbierto(false)} />
      )}
      {citasAbierto && (
        <CitasModal solicitudId={item.id} onClose={() => setCitasAbierto(false)} />
      )}
      {reservasAbierto && (
        <ReservasModal solicitudId={item.id} onClose={() => setReservasAbierto(false)} />
      )}
    </div>
  );
}

export default function Solicitudes() {
  const { negocioId } = useParams();
  const [items, setItems] = useState([]);

  const load = () => api.get(`/admin/negocios/${negocioId}/solicitudes`).then(setItems).catch(() => setItems([]));

  useEffect(() => { load(); }, [negocioId]);

  return (
    <div>
      <h1>Solicitudes / conversaciones</h1>
      <p style={{ color: '#9aa1ad' }}>
        Banear un número apaga el bot para esa conversación de forma permanente (no se
        reactiva solo a las 24h como una pausa normal) — queda a decisión humana reactivarlo.
        Úsalo para pedidos falsos a domicilio o abuso.
      </p>
      {items.length === 0 && <p style={{ color: '#9aa1ad' }}>Aún no hay conversaciones registradas.</p>}
      {items.map((item) => (
        <SolicitudRow key={item.id} item={item} onUpdated={load} />
      ))}
    </div>
  );
}
