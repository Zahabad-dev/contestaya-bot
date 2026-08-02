import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import '../../styles/estetica-barberia.css';

const WHATSAPP_FALLBACK = '5217751667681';

const SERVICIOS_DEMO = [
  { pregunta: 'Corte y peinado', respuesta: 'Corte a la medida + peinado con plancha o tenaza. — $250 · 45 min' },
  { pregunta: 'Manicure spa', respuesta: 'Limado, cutícula, masaje y esmaltado. — $220 · 40 min' },
  { pregunta: 'Pedicure spa', respuesta: 'Exfoliación, masaje y esmaltado. — $250 · 50 min' },
  { pregunta: 'Facial hidratante', respuesta: 'Limpieza profunda + mascarilla hidratante. — $350 · 60 min' },
  { pregunta: 'Depilación de cejas', respuesta: 'Diseño y depilación con cera o hilo. — $120 · 15 min' },
  { pregunta: 'Maquillaje social', respuesta: 'Maquillaje para evento, incluye pestañas. — $450 · 60 min' },
];

const DIAS = ['Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORAS = ['10:00 am', '12:00 pm', '3:00 pm', '5:00 pm', '7:00 pm'];

export default function AgendaInteractiva() {
  const { slug } = useParams();
  const [negocio, setNegocio] = useState(null);
  const [faq, setFaq] = useState([]);
  const [error, setError] = useState(false);
  const [nombreCliente, setNombreCliente] = useState('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null); // { dia, hora }

  useEffect(() => {
    Promise.all([
      api.get(`/public/negocio/${slug}`),
      api.get(`/public/negocio/${slug}/faq`),
    ])
      .then(([n, f]) => {
        setNegocio(n);
        setFaq(f);
      })
      .catch(() => setError(true));
  }, [slug]);

  const servicios = faq.filter((f) => f.categoria === 'servicios');
  const serviciosMostrados = servicios.length > 0 ? servicios : SERVICIOS_DEMO;

  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;
  const listo = nombreCliente.trim() && servicioSeleccionado && slotSeleccionado;

  const agendarPorWhatsapp = () => {
    if (!listo) return;
    const mensaje = [
      '[CITA_INTERACTIVA]',
      `Nombre: ${nombreCliente.trim()}`,
      `Servicio: ${servicioSeleccionado.pregunta}`,
      `Día: ${slotSeleccionado.dia}`,
      `Horario: ${slotSeleccionado.hora}`,
    ].join('\n');
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noreferrer');
  };

  return (
    <div className="eb-page">
      <header className="eb-hero eb-hero-compact">
        {negocio?.logo_data_url && <img src={negocio.logo_data_url} alt="" className="eb-logo" />}
        <h1>{negocio?.nombre || 'Glow Studio'}</h1>
        <p className="eb-tagline">AGENDA TU CITA</p>
        {error && <p className="eb-hint">(Demo sin conexión a la base de datos — así se verá con datos reales.)</p>}
      </header>

      <section className="eb-section">
        <h2>1. Tu nombre</h2>
        <label className="eb-field-label">¿Cómo te llamas?</label>
        <input
          className="eb-input"
          value={nombreCliente}
          onChange={(e) => setNombreCliente(e.target.value)}
          placeholder="Ej. Ana Torres"
        />
      </section>

      <section className="eb-section">
        <h2>2. Elige tu servicio</h2>
        <div className="eb-grid">
          {serviciosMostrados.map((item, i) => (
            <button
              key={i}
              className={`eb-servicio-card ${servicioSeleccionado?.pregunta === item.pregunta ? 'eb-servicio-card-activa' : ''}`}
              onClick={() => setServicioSeleccionado(item)}
            >
              <h3>{item.pregunta}</h3>
              <p>{item.respuesta}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="eb-section">
        <h2>3. Elige día y horario</h2>
        {DIAS.map((dia) => (
          <div key={dia} style={{ marginBottom: '1rem' }}>
            <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: '0.5rem' }}>{dia}</p>
            <div className="eb-agenda-grid">
              {HORAS.map((hora) => {
                const activo = slotSeleccionado?.dia === dia && slotSeleccionado?.hora === hora;
                return (
                  <button
                    key={hora}
                    className={`eb-slot ${activo ? 'eb-slot-activo' : ''}`}
                    onClick={() => setSlotSeleccionado({ dia, hora })}
                  >
                    {hora}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <div className="eb-agenda-bar">
        <button className="eb-cta" onClick={agendarPorWhatsapp} disabled={!listo}>
          Agendar por WhatsApp
        </button>
      </div>

      <footer className="eb-footer">
        <p>{negocio?.nombre || ''} · {negocio?.ciudad || ''}</p>
        <p className="eb-powered">Demo del ecosistema de bots — Black Sheep Agencia</p>
      </footer>
    </div>
  );
}
