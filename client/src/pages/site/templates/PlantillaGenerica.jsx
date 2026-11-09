import '../../../styles/generico.css';

// Pagina publica de un negocio con la plantilla por defecto de ContestaYa.
// Todo sale de los datos del negocio (nombre, giro, ciudad, FAQ): moldear otro giro = cambiar filas.

const ICONOS = {
  horarios: '🕒',
  horario: '🕒',
  ubicacion: '📍',
  precios: '💲',
  menu: '🍽️',
  pagos: '💳',
  servicios: '🛠️',
  general: '✨',
};
const icono = (cat) => ICONOS[(cat || '').toLowerCase()] || '💬';
const titulo = (cat) => {
  const t = (cat || 'general').toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const soloDigitos = (s) => (s || '').replace(/\D/g, '');

export default function PlantillaGenerica({ negocio, faq = [], error }) {
  const nombre = negocio?.nombre || 'Tu negocio';
  const numero = soloDigitos(negocio?.whatsapp_numero);
  const wa = numero.length >= 8 ? `https://wa.me/${numero}` : null;
  const ejemplos = faq.slice(0, 2);

  return (
    <div className="gx">
      <nav className="gx-nav">
        <div className="gx-nav-in">
          <span className="gx-brand">
            {negocio?.logo_data_url ? (
              <img src={negocio.logo_data_url} alt="" />
            ) : (
              <span className="gx-mark">{nombre.charAt(0)}</span>
            )}
            {nombre}
          </span>
          {wa && (
            <a className="gx-btn gx-btn-sm" href={wa} target="_blank" rel="noreferrer">
              Escribir por WhatsApp
            </a>
          )}
        </div>
      </nav>

      <header className="gx-hero">
        <div className="gx-hero-in">
          <div className="gx-hero-text">
            <div className="gx-chips">
              {negocio?.giro && <span className="gx-chip gx-chip-giro">{negocio.giro}</span>}
              {negocio?.ciudad && <span className="gx-chip">📍 {negocio.ciudad}</span>}
              <span className="gx-chip gx-chip-live">
                <i /> Atiende ahora
              </span>
            </div>
            <h1>{nombre}</h1>
            <p className="gx-lead">
              Resolvemos tus dudas al instante por WhatsApp: horarios, precios, ubicación y más,
              a cualquier hora del día.
            </p>
            <div className="gx-actions">
              {wa && (
                <a className="gx-btn" href={wa} target="_blank" rel="noreferrer">
                  Escríbenos por WhatsApp
                </a>
              )}
              <a className="gx-btn gx-btn-ghost" href="#preguntas">
                Ver preguntas frecuentes
              </a>
            </div>
            {error && <p className="gx-hint">No pudimos cargar la información del negocio.</p>}
          </div>

          <div className="gx-phone" aria-hidden="true">
            <div className="gx-phone-top">
              <span className="gx-mark gx-mark-sm">{nombre.charAt(0)}</span>
              <div>
                <strong>{nombre}</strong>
                <small>en línea</small>
              </div>
            </div>
            <div className="gx-chat">
              {ejemplos.length === 0 && <div className="gx-msg gx-bot">¡Hola! ¿En qué te puedo ayudar?</div>}
              {ejemplos.map((f, i) => (
                <div key={i} className="gx-pair" style={{ animationDelay: `${i * 0.9}s` }}>
                  <div className="gx-msg gx-user">{f.pregunta.split('?')[0].replace('¿', '')}?</div>
                  <div className="gx-msg gx-bot">{f.respuesta}</div>
                </div>
              ))}
              <div className="gx-typing">
                <i /> <i /> <i />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {faq.length > 0 && (
          <section className="gx-sec" id="preguntas">
            <h2>Preguntas frecuentes</h2>
            <p className="gx-sub">Lo que más nos preguntan, contestado al momento.</p>
            <div className="gx-grid">
              {faq.map((item, i) => (
                <article className="gx-card" key={i}>
                  <span className="gx-ico">{icono(item.categoria)}</span>
                  <small>{titulo(item.categoria)}</small>
                  <h3>{item.pregunta}</h3>
                  <p>{item.respuesta}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {wa && (
          <section className="gx-cta">
            <h2>¿Tienes otra duda?</h2>
            <p>Escríbenos y te respondemos por WhatsApp. Si necesitas a una persona, te la pasamos.</p>
            <a className="gx-btn" href={wa} target="_blank" rel="noreferrer">
              Abrir WhatsApp
            </a>
          </section>
        )}
      </main>

      <footer className="gx-foot">
        <p>
          {nombre}
          {negocio?.ciudad ? ` · ${negocio.ciudad}` : ''}
        </p>
        <p className="gx-powered">
          Atención automática con{' '}
          <a href="https://www.contestaya.app" target="_blank" rel="noreferrer">
            ContestaYa
          </a>
        </p>
      </footer>
    </div>
  );
}
