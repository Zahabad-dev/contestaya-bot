import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import '../../styles/resto-bar.css';
import '../../styles/flora.css';

const WHATSAPP_FALLBACK = '5217751667681';

// Mismo menu de respaldo que la plantilla Resto-bar — se muestra si el negocio
// todavia no tiene filas de FAQ con estas categorias (entradas/fuertes/bebidas/postres).
const MENU_DEMO_RESTOBAR = {
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

// Menu de respaldo de la plantilla Flora — mismas categorias, contenido de cocina
// de temporada/organica, para que ningun negocio 'resto-bar' se cruce con contenido
// de 'flora' ni viceversa (cada plantilla trae su propio MENU_DEMO).
const MENU_DEMO_FLORA = {
  entradas: [
    { pregunta: 'Ensalada de temporada', respuesta: 'Hojas mixtas del huerto, vinagreta de citricos y semillas tostadas. — $135', imagen_url: 'https://images.unsplash.com/photo-1675729378170-dff874aaaa24?w=600&q=60&fit=crop&auto=format' },
    { pregunta: 'Tartara de betabel y queso de cabra', respuesta: 'Betabel asado, queso de cabra cremoso y nueces caramelizadas. — $150', imagen_url: 'https://images.unsplash.com/photo-1582983552131-5d59920a9476?w=600&q=60&fit=crop&auto=format' },
    { pregunta: 'Carpaccio de calabacita', respuesta: 'Laminas finas de calabacita, parmesano y aceite de albahaca. — $140', imagen_url: 'https://images.unsplash.com/photo-1616671285410-2a676a9a433d?w=600&q=60&fit=crop&auto=format' },
  ],
  fuertes: [
    { pregunta: 'Bacalao escalfado con hinojo y eneldo', respuesta: 'Bacalao del dia escalfado en mantequilla de hierbas, hinojo asado y eneldo fresco. — $265', imagen_url: 'https://images.unsplash.com/photo-1663530761401-15eefb544889?w=600&q=60&fit=crop&auto=format' },
    { pregunta: 'Risotto de hongos silvestres', respuesta: 'Arroz cremoso, mezcla de hongos de temporada y trufa. — $210', imagen_url: 'https://images.unsplash.com/photo-1694021408920-922ff450c525?w=600&q=60&fit=crop&auto=format' },
    { pregunta: 'Pechuga de pato con pure de zanahoria', respuesta: 'Pato a la plancha, pure de zanahoria asada y jus de naranja. — $255', imagen_url: 'https://images.unsplash.com/photo-1621494268492-d01b98eba7e4?w=600&q=60&fit=crop&auto=format' },
  ],
  bebidas: [
    { pregunta: 'Copa de vino natural de la casa', respuesta: 'Seleccion rotativa de productores organicos. — $120', imagen_url: 'https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?w=600&q=60&fit=crop&auto=format' },
    { pregunta: 'Coctel de temporada', respuesta: 'Infusion de hierbas del huerto, citricos y mezcal. — $130', imagen_url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?w=600&q=60&fit=crop&auto=format' },
    { pregunta: 'Limonada de romero y jengibre', respuesta: 'Sin alcohol, refrescante y endulzada con miel. — $70', imagen_url: 'https://images.unsplash.com/photo-1596438214057-5ff7c7fa76b1?w=600&q=60&fit=crop&auto=format' },
  ],
  postres: [
    { pregunta: 'Tarta de frutos rojos', respuesta: 'Masa quebrada, crema de vainilla y frutos del bosque. — $95', imagen_url: 'https://images.unsplash.com/photo-1785013045154-9ed0ca025e60?w=600&q=60&fit=crop&auto=format' },
    { pregunta: 'Panna cotta de lavanda', respuesta: 'Con coulis de durazno y flor de lavanda. — $90', imagen_url: 'https://images.unsplash.com/photo-1784041948030-a3311992721a?w=600&q=60&fit=crop&auto=format' },
  ],
};

const SECCIONES = [
  { key: 'entradas', titulo: 'Entradas' },
  { key: 'fuertes', titulo: 'Platos fuertes' },
  { key: 'bebidas', titulo: 'Bebidas y bar' },
  { key: 'postres', titulo: 'Postres' },
];

export default function MenuInteractivo() {
  const { slug } = useParams();
  const [negocio, setNegocio] = useState(null);
  const [faq, setFaq] = useState([]);
  const [error, setError] = useState(false);
  const [tabActiva, setTabActiva] = useState(SECCIONES[0].key);
  const [itemAbierto, setItemAbierto] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [resumenAbierto, setResumenAbierto] = useState(false);
  const [entregaAbierto, setEntregaAbierto] = useState(false);

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

  // La plantilla visual decide el "skin" (clases CSS + copy de respaldo) de este menu,
  // pero la logica de seleccion/pedido es identica para cualquier negocio con
  // tipo_funcion = 'pedidos' — asi nunca se mezcla contenido de una plantilla con otra.
  const esFlora = negocio?.plantilla === 'flora';
  const px = esFlora ? 'fl' : 'rb';
  const MENU_DEMO = esFlora ? MENU_DEMO_FLORA : MENU_DEMO_RESTOBAR;

  const porCategoria = (clave) => {
    const propios = faq.filter((f) => f.categoria === clave);
    return propios.length > 0 ? propios : MENU_DEMO[clave];
  };

  const estaSeleccionado = (item) => seleccionados.some((s) => s.pregunta === item.pregunta);

  const toggleSeleccion = (item) => {
    setSeleccionados((prev) =>
      prev.some((s) => s.pregunta === item.pregunta)
        ? prev.filter((s) => s.pregunta !== item.pregunta)
        : [...prev, item]
    );
  };

  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;

  // Mensaje con marcador que el flujo de n8n detecta ("Detectar Pedido Interactivo") para
  // registrar el pedido en la tabla `pedidos` — el texto despues del marcador son los items.
  const pedirPorWhatsapp = (tipoEntrega) => {
    const marcador = tipoEntrega === 'domicilio' ? 'DOMICILIO' : 'PASO_POR_EL';
    let mensaje;
    if (seleccionados.length > 0) {
      const lineas = seleccionados.map((it) => `- ${it.pregunta}: ${it.respuesta}`).join('\n');
      mensaje = `[PEDIDO_INTERACTIVO:${marcador}]\n${lineas}`;
    } else {
      mensaje = tipoEntrega === 'domicilio' ? 'Hola, quiero pedir a domicilio' : 'Hola, quiero pasar por mi pedido';
    }
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noreferrer');
    setEntregaAbierto(false);
  };

  return (
    <div className={`${px}-page`}>
      <header className={`${px}-hero ${px}-hero-compact`}>
        {negocio?.logo_data_url && <img src={negocio.logo_data_url} alt="" className={`${px}-logo`} />}
        <h1>{negocio?.nombre || 'Menú'}</h1>
        <p className={`${px}-tagline`}>MENÚ INTERACTIVO</p>
        <p className={esFlora ? 'fl-sub' : `${px}-sub`}>Selecciona lo que quieras y arma tu pedido para pedirlo en tu mesa.</p>
        {error && <p className={`${px}-hint`}>(Demo sin conexión a la base de datos — así se verá con datos reales.)</p>}
      </header>

      <nav className={`${px}-tabs`}>
        {SECCIONES.map((s) => (
          <button
            key={s.key}
            className={`${px}-tab ${tabActiva === s.key ? `${px}-tab-activa` : ''}`}
            onClick={() => setTabActiva(s.key)}
          >
            {s.titulo}
          </button>
        ))}
      </nav>

      <section className={`${px}-section`}>
        <div className={`${px}-grid`}>
          {porCategoria(tabActiva).map((item, i) => (
            <div className={`${px}-card ${estaSeleccionado(item) ? `${px}-card-seleccionada` : ''}`} key={i}>
              {item.imagen_url ? (
                <img src={item.imagen_url} alt={item.pregunta} className={`${px}-card-img`} />
              ) : (
                <div className={`${px}-card-img ${px}-card-img-placeholder`}>🍽️</div>
              )}
              <div className={esFlora ? 'fl-card-body' : ''}>
                <h3>{item.pregunta}</h3>
                <p>{item.respuesta}</p>
                <div className={`${px}-card-actions`}>
                  <button className={`${px}-card-link`} onClick={() => setItemAbierto(item)}>Ver más ⤢</button>
                  <button
                    className={`${px}-select-btn ${estaSeleccionado(item) ? `${px}-select-btn-activo` : ''}`}
                    onClick={() => toggleSeleccion(item)}
                  >
                    {estaSeleccionado(item) ? '✓ Agregado' : '+ Agregar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={`${px}-orden-bar`}>
        <button
          className={`${px}-cta ${px}-cta-fixed`}
          onClick={() => setResumenAbierto(true)}
          disabled={seleccionados.length === 0}
        >
          Pedido listo{seleccionados.length > 0 && ` (${seleccionados.length})`}
        </button>
        <button className={`${px}-link-domicilio`} onClick={() => setEntregaAbierto(true)}>
          ¿Vas a pedir a domicilio? Escríbenos por WhatsApp
        </button>
      </div>

      {itemAbierto && (
        <div className={`${px}-modal-overlay`} onClick={() => setItemAbierto(null)}>
          <div className={`${px}-modal`} onClick={(e) => e.stopPropagation()}>
            <button className={`${px}-modal-close`} onClick={() => setItemAbierto(null)}>✕</button>
            {itemAbierto.imagen_url ? (
              <img src={itemAbierto.imagen_url} alt={itemAbierto.pregunta} className={`${px}-modal-img`} />
            ) : (
              <div className={`${px}-modal-img ${px}-card-img-placeholder`}>🍽️</div>
            )}
            <h2>{itemAbierto.pregunta}</h2>
            <p>{itemAbierto.respuesta}</p>
          </div>
        </div>
      )}

      {resumenAbierto && (
        <div className={`${px}-modal-overlay`} onClick={() => setResumenAbierto(false)}>
          <div className={`${px}-modal`} onClick={(e) => e.stopPropagation()}>
            <button className={`${px}-modal-close`} onClick={() => setResumenAbierto(false)}>✕</button>
            <h2>Tu pedido</h2>
            <ul className={`${px}-resumen-lista`}>
              {seleccionados.map((it, i) => (
                <li key={i}>
                  <strong>{it.pregunta}</strong>
                  <span>{it.respuesta}</span>
                </li>
              ))}
            </ul>
            <p className={`${px}-resumen-aviso`}>
              👋 Indícale esto a tu mesero para ordenar — este resumen es solo para ti, no se envía
              automáticamente a nadie.
            </p>
          </div>
        </div>
      )}

      {entregaAbierto && (
        <div className={`${px}-modal-overlay`} onClick={() => setEntregaAbierto(false)}>
          <div className={`${px}-modal`} onClick={(e) => e.stopPropagation()}>
            <button className={`${px}-modal-close`} onClick={() => setEntregaAbierto(false)}>✕</button>
            <h2>¿Cómo quieres tu pedido?</h2>
            <div className={`${px}-entrega-opciones`}>
              <button className={`${px}-entrega-btn`} onClick={() => pedirPorWhatsapp('pickup')}>
                🚶 Paso por él
                <span>Recoges tu pedido directo en el local</span>
              </button>
              <button className={`${px}-entrega-btn`} onClick={() => pedirPorWhatsapp('domicilio')}>
                🛵 A domicilio
                <span>Te lo llevamos a tu dirección</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className={`${px}-footer`}>
        <p>{negocio?.nombre || ''} · {negocio?.ciudad || ''}</p>
        <p className={`${px}-powered`}>Demo del ecosistema de bots — Black Sheep Agencia</p>
      </footer>
    </div>
  );
}
