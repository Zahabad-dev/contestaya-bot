import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import '../../../styles/flora.css';

const WHATSAPP_FALLBACK = '5217751667681'; // numero de demo del usuario para probar el QR

// Solo el platillo destacado para la foto del hero — el resto del menu (mismo
// fallback que usa /menu/:slug) vive en MenuInteractivo.jsx, no se duplica aqui.
const PLATO_DESTACADO_DEMO = {
  pregunta: 'Bacalao escalfado con hinojo y eneldo',
  respuesta: 'Bacalao del dia escalfado en mantequilla de hierbas, hinojo asado y eneldo fresco. — $265',
  imagen_url: 'https://images.unsplash.com/photo-1663530761401-15eefb544889?w=600&q=60&fit=crop&auto=format',
};

function LeafIcon() {
  return (
    <svg className="fl-leaf-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M4 20C4 10 12 4 20 4C20 12 14 20 4 20Z" />
      <path d="M4 20C8 16 12 12 20 4" />
    </svg>
  );
}

export default function PlantillaElegante({ negocio, faq, error }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;
  const mensajePrellenado = encodeURIComponent('Hola, quiero ver el menú');
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${mensajePrellenado}`;
  const whatsappReservaUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola, quiero reservar una mesa')}`;
  const slug = negocio?.slug || 'flora';

  useEffect(() => {
    QRCode.toDataURL(whatsappUrl, { width: 320, margin: 1, color: { dark: '#2c2a22', light: '#f4f1e6' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [whatsappUrl]);

  const fuertesPropios = faq.filter((f) => f.categoria === 'fuertes');
  const platoDestacado = fuertesPropios[0] || PLATO_DESTACADO_DEMO;

  return (
    <div className="fl-page">
      <nav className="fl-nav">
        <div className="fl-brand">
          {negocio?.logo_data_url ? (
            <img src={negocio.logo_data_url} alt="" className="fl-brand-logo" />
          ) : (
            <LeafIcon />
          )}
          {negocio?.nombre || 'Flora'}
        </div>
        <ul className="fl-nav-links">
          <li><a href={`/menu/${slug}`}>Menú</a></li>
          <li><a href={whatsappReservaUrl} target="_blank" rel="noreferrer">Reservas</a></li>
          <li><a href="#ubicacion">Ubicación</a></li>
          <li><a href={whatsappUrl} target="_blank" rel="noreferrer">Contacto</a></li>
        </ul>
      </nav>

      {error && (
        <p style={{ textAlign: 'center', color: '#6b6858', fontSize: '0.85rem', padding: '0.75rem' }}>
          (Demo sin conexión a la base de datos — así se verá el sitio con datos reales.)
        </p>
      )}

      <section className="fl-hero">
        <div className="fl-hero-media">
          {platoDestacado?.imagen_url && <img src={platoDestacado.imagen_url} alt={platoDestacado.pregunta} className="fl-hero-img" />}
          <div className="fl-hero-card">
            <span className="fl-hero-badge">Cocina de temporada · Km 0</span>
            <h1>{negocio?.nombre || 'Flora'}</h1>
            <p>Ingredientes de temporada, huerto propio y pescado sostenible — en un ambiente sereno y minimalista.</p>
            <div className="fl-hero-actions">
              <a className="fl-cta" href={`/menu/${slug}`}>Ver menú</a>
              <a className="fl-cta fl-cta-outline" href={whatsappUrl} target="_blank" rel="noreferrer">Pedir por WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      <section className="fl-qr-section">
        <div className="fl-qr-card">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR para pedir por WhatsApp" className="fl-qr-img" />
              <a className="fl-qr-download" href={qrDataUrl} download={`qr-whatsapp-${slug}.png`}>Descargar QR</a>
            </>
          ) : (
            <p>Generando QR…</p>
          )}
          <p className="fl-qr-caption">Escanéalo en mesa — lleva directo a WhatsApp para pedir el menú</p>
        </div>
        <a className="fl-cta" href={whatsappUrl} target="_blank" rel="noreferrer">Pedir por WhatsApp</a>
      </section>

      <div className="fl-cards-row" id="ubicacion">
        <div className="fl-mini-card">
          <h3>Reservar mesa</h3>
          <a href={whatsappReservaUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
        </div>
        <div className="fl-mini-card">
          <h3>Ver menú</h3>
          <a href={`/menu/${slug}`}>Platillos y bebidas</a>
        </div>
        <div className="fl-mini-card">
          <h3>Ubicación</h3>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(negocio?.nombre || 'Flora')}+${encodeURIComponent(negocio?.ciudad || '')}`} target="_blank" rel="noreferrer">
            {negocio?.ciudad || 'Ver ubicación'}
          </a>
        </div>
      </div>

      <footer className="fl-footer">
        <p>{negocio?.nombre || 'Flora'} · {negocio?.ciudad || ''}</p>
        <p className="fl-powered">Demo del ecosistema de bots — Black Sheep Agencia</p>
      </footer>
    </div>
  );
}
