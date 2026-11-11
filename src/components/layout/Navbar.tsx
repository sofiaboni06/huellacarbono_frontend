/**
 * Barra de navegación global de HuellaVerde.
 *
 * Es la única barra de la aplicación: la consumen el Dashboard y todas las
 * vistas de la fase actual, de modo que ninguna pantalla muestra una barra
 * distinta a las demás.
 *
 * Esta entrada delega en la implementación única `NavbarInicio`, que a su vez
 * integra los dos menús reales de la barra (sin duplicarlos):
 *
 *   - Campana  → `MenuNotificaciones`  (src/pages/Inicio/components/MenuNotificaciones.tsx)
 *   - Avatar   → `MenuPerfil`          (src/pages/Inicio/components/MenuPerfil.tsx)
 *
 * Ambos menús comparten el estado de notificaciones global
 * (`NotificacionesContext`) y el estado de perfil (`PerfilContext`).
 */
import NavbarInicio from '../../pages/Inicio/components/NavbarInicio'

export default NavbarInicio
