import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import '../../../styles/estetica-barberia.css';

const WHATSAPP_FALLBACK = '5217751667681';

// Servicios de ejemplo — se usan solo si el negocio todavia no tiene FAQ propia con
// categoria "servicios". En cuanto haya filas reales, esas reemplazan a este demo.
const SERVICIOS_DEMO = [
  { pregunta: 'Corte y peinado', respuesta: 'Corte a la medida + peinado con plancha o tenaza. — $250 · 45 min' },
  { pregunta: 'Manicure spa', respuesta: 'Limado, cutícula, masaje y esmaltado. — $220 · 40 min' },
  { pregunta: 'Pedicure spa', respuesta: 'Exfoliación, masaje y esmaltado. — $250 · 50 min' },
  { pregunta: 'Facial hidratante', respuesta: 'Limpieza profunda + mascarilla hidratante. — $350 · 60 min' },
  { pregunta: 'Depilación de cejas', respuesta: 'Diseño y depilación con cera o hilo. — $120 · 15 min' },
  { pregunta: 'Maquillaje social', respuesta: 'Maquillaje para evento, incluye pestañas. — $450 · 60 min' },
];

export default function PlantillaEsteticaBarberia({ negocio, faq, error }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;
  const mensajePrellenado = encodeURIComponent(
    'Hola, quiero agendar una cita 💇‍♀️ — cuéntame tu nombre, el servicio que buscas y el horario que prefieres'
  );
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${mensajePrellenado}`;

  useEffect(() => {
    QRCode.toDataURL(whatsappUrl, { width: 320, margin: 1, color: { dark: '#0d0d0d', light: '#f7f3ea' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [whatsappUrl]);

  const servicios = faq.filter((f) => f.categoria === 'servicios');
  const serviciosMostrados = servicios.length > 0 ? servicios : SERVICIOS_DEMO;

  return (
    <div className="eb-page">
      <header className="eb-hero">
        {negocio?.logo_data_url && <img src={negocio.logo_data_url} alt="" className="eb-logo" />}
        <span className="eb-badge">📍 {negocio?.ciudad || 'Tu ciudad'}</span>
        <h1>{negocio?.nombre || 'Glow Studio'}</h1>
        <p className="eb-tagline">BELLEZA · ESTILO · CONFIANZA</p>
        <p className="eb-sub">Escanea el QR o escríbenos por WhatsApp para agendar tu cita.</p>
        {error && <p className="eb-hint">(Demo sin conexión a la base de datos — así se verá el sitio con datos reales.)</p>}
      </header>

      <section className="eb-qr-section">
        <div className="eb-qr-card">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR para agendar por WhatsApp" className="eb-qr-img" />
              <a className="eb-qr-download" href={qrDataUrl} download={`qr-whatsapp-${negocio?.slug || 'demo'}.png`}>
                Descargar QR
              </a>
            </>
          ) : (
            <p>Generando QR…</p>
          )}
          <p className="eb-qr-caption">Escanéalo para agendar tu cita por WhatsApp</p>
        </div>
        <a className="eb-cta" href={whatsappUrl} target="_blank" rel="noreferrer">
          Agendar por WhatsApp
        </a>
      </section>

      <section className="eb-section">
        <h2>Servicios</h2>
        <div className="eb-grid">
          {serviciosMostrados.map((item, i) => (
            <div className="eb-card" key={i}>
              <h3>{item.pregunta}</h3>
              <p>{item.respuesta}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="eb-footer">
        <p>{negocio?.nombre || 'Glow Studio'} · {negocio?.ciudad || ''}</p>
        <p className="eb-powered">Demo del ecosistema de bots — Black Sheep Agencia</p>
      </footer>
    </div>
  );
}
