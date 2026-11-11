import SelectorOrganizacion from './SelectorOrganizacion'
import globoTierra from '../../../assets/images/globe.png'
import hojaMarca from '../../../assets/images/hv-leaf.png'
import './Bienvenida.css'

/** Cabecera de bienvenida del panel de inicio. */
export default function Bienvenida() {
  return (
    <section className="ini-bienvenida" aria-label="Bienvenida">
      <div className="ini-bienvenida-fondo" aria-hidden="true" />
      <div className="ini-bienvenida-brillo" aria-hidden="true" />

      <div className="ini-bienvenida-texto">
        <h1 className="ini-bienvenida-saludo">¡Hola, Sofía!</h1>
        <p className="ini-bienvenida-subtitulo">Bienvenida de nuevo a HuellaVerde</p>
        <SelectorOrganizacion />
      </div>

      <div className="ini-bienvenida-visual">
        <img
          className="ini-bienvenida-globo"
          src={globoTierra}
          alt="Planeta Tierra rodeado de vegetación"
        />
        <aside className="ini-bienvenida-nota">
          <img className="ini-bienvenida-nota-icono" src={hojaMarca} alt="" aria-hidden="true" />
          <p className="ini-bienvenida-nota-texto">
            Pequeñas acciones,
            <br />
            grandes cambios
          </p>
        </aside>
      </div>
    </section>
  )
}
