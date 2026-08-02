import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import '../../../styles/resto-bar.css';

const WHATSAPP_FALLBACK = '5217751667681'; // numero de demo del usuario para probar el QR

// Menu de ejemplo — se usa solo si el negocio todavia no tiene FAQ propia cargada
// (categorias: entradas, fuertes, bebidas, postres). En cuanto haya filas reales
// en la FAQ del negocio con esas categorias, esas reemplazan a este demo.
const MENU_DEMO = {
  entradas: [
    { pregunta: 'Botana de la casa', respuesta: 'Totopos, guacamole, pico de gallo y queso fundido. — $145', imagen_url: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=600&q=60&fit=crop&auto=format' },
    { pregunta: 'Alitas BBQ (8 pzas)', respuesta: 'Bañadas en salsa BBQ casera, con apio y aderezo ranch. — $165', imagen_url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=60&fit=crop&auto=format' },
    { pregunta: 'Dedos de queso', respuesta: 'Panko crujiente con mermelada de chipotle. — $120', imagen_url: 'https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=600&q=60&fit=crop&auto=format' },
  ],
  fuertes: [
    { pregunta: 'Hamburguesa Black Angus', respuesta: '200g, tocino, queso cheddar, cebolla caramelizada. — $185', imagen_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=60&fit=crop&auto=format' },
    { pregunta: 'Costillas BBQ (media)', respuesta: 'Costillas de cerdo glaseadas, papas y ensalada. — $245', imagen_url: 'https://images.unsplash.com/photo-1679711246825-1f2bd51b16d0?w=600&q=60&fit=crop&auto=format' },
    { pregunta: 'Fettuccine Alfredo con pollo', respuesta: 'Pasta fresca, salsa cremosa, pollo a la plancha. — $175', imagen_url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&q=60&fit=crop&auto=format' },
  ],
  bebidas: [
    { pregunta: 'Michelada de la casa', respuesta: 'Con especias secretas y chamoy. — $95', imagen_url: 'https://images.unsplash.com/photo-1706642249439-6cffa7a2a210?w=600&q=60&fit=crop&auto=format' },
    { pregunta: 'Mezcal Paloma', respuesta: 'Mezcal, refresco de toronja, sal de gusano. — $110', imagen_url: 'https://images.unsplash.com/photo-1619032580077-6160b89e2398?w=600&q=60&fit=crop&auto=format' },
    { pregunta: 'Cerveza artesanal', respuesta: 'Varias opciones, consulta la del día. — $75', imagen_url: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=600&q=60&fit=crop&auto=format' },
  ],
  postres: [
    { pregunta: 'Volcán de chocolate', respuesta: 'Con helado de vainilla. — $95', imagen_url: 'https://images.unsplash.com/photo-1605807646983-377bc5a76493?w=600&q=60&fit=crop&auto=format' },
    { pregunta: 'Cheesecake de zarzamora', respuesta: 'Casero, con coulis de frutos rojos. — $90', imagen_url: 'https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=600&q=60&fit=crop&auto=format' },
  ],
};

const SECCIONES = [
  { key: 'entradas', titulo: 'Entradas' },
  { key: 'fuertes', titulo: 'Platos fuertes' },
  { key: 'bebidas', titulo: 'Bebidas y bar' },
  { key: 'postres', titulo: 'Postres' },
];

export default function PlantillaRestoBar({ negocio, faq, error }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;
  const mensajePrellenado = encodeURIComponent('Hola, quiero ver el menú');
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${mensajePrellenado}`;
  const whatsappReservaUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola, quiero reservar una mesa')}`;

  useEffect(() => {
    QRCode.toDataURL(whatsappUrl, { width: 320, margin: 1, color: { dark: '#1b1410', light: '#f2e9d8' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [whatsappUrl]);

  const porCategoria = (clave) => {
    const propios = faq.filter((f) => f.categoria === clave);
    return propios.length > 0 ? propios : MENU_DEMO[clave];
  };

  return (
    <div className="rb-page">
      <header className="rb-hero">
        {negocio?.logo_data_url && <img src={negocio.logo_data_url} alt="" className="rb-logo" />}
        <span className="rb-badge">📍 {negocio?.ciudad || 'Tu ciudad'}</span>
        <h1>{negocio?.nombre || 'Resto-Bar Demo'}</h1>
        <p className="rb-tagline">COCINA · BAR · BUEN AMBIENTE</p>
        <p className="rb-sub">Escanea el QR o escríbenos por WhatsApp para pedir el menú y hacer tu orden.</p>
        {error && <p className="rb-hint">(Demo sin conexión a la base de datos — así se verá el sitio con datos reales.)</p>}
      </header>

      <section className="rb-qr-section">
        <div className="rb-qr-card">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR para pedir por WhatsApp" className="rb-qr-img" />
              <a className="rb-qr-download" href={qrDataUrl} download={`qr-whatsapp-${negocio?.slug || 'demo'}.png`}>
                Descargar QR
              </a>
            </>
          ) : (
            <p>Generando QR…</p>
          )}
          <p className="rb-qr-caption">Escanéalo en mesa — lleva directo a WhatsApp para pedir el menú</p>
        </div>
        <a className="rb-cta" href={whatsappUrl} target="_blank" rel="noreferrer">
          Pedir por WhatsApp
        </a>
        <a className="rb-cta rb-cta-outline" href={whatsappReservaUrl} target="_blank" rel="noreferrer">
          Reservar mesa
        </a>
      </section>

      {SECCIONES.map((seccion) => (
        <section className="rb-section" key={seccion.key}>
          <h2>{seccion.titulo}</h2>
          <div className="rb-grid">
            {porCategoria(seccion.key).map((item, i) => (
              <div className="rb-card" key={i}>
                {item.imagen_url && <img src={item.imagen_url} alt={item.pregunta} className="rb-card-img" />}
                <h3>{item.pregunta}</h3>
                <p>{item.respuesta}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <footer className="rb-footer">
        <p>{negocio?.nombre || 'Resto-Bar Demo'} · {negocio?.ciudad || ''}</p>
        <p className="rb-powered">Demo del ecosistema de bots — Black Sheep Agencia</p>
      </footer>
    </div>
  );
}
