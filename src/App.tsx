import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { codigoDeRuta, destinoGestion, puedeEntrar } from './services/acceso'
import { leerToken } from './services/sesion'
import { AvisoProvider } from './components/layout/PlantillaVista'
import { NotificacionesProvider } from './context/NotificacionesContext'
import { PerfilProvider, usePerfil } from './context/PerfilContext'
import { PreferenciasProvider } from './context/PreferenciasContext'
import Login from './pages/Login/Login'
import Landing from './pages/Landing/Landing'
import Inicio from './pages/Inicio/Inicio'
import Calculos from './pages/Calculos/Calculos'
import Reportes from './pages/Reportes/Reportes'
import Configuracion from './pages/Configuracion/Configuracion'
import Ayuda from './pages/Ayuda/Ayuda'
import Guias from './pages/Guias/Guias'
import Perfil from './pages/Perfil/Perfil'
import SeccionPerfil from './pages/Perfil/SeccionPerfil'
import SeccionNotificaciones from './pages/Perfil/SeccionNotificaciones'
import SeccionSeguridad from './pages/Perfil/SeccionSeguridad'
import SeccionPreferencias from './pages/Perfil/SeccionPreferencias'
import Usuarios from './pages/Gestion/Usuarios/Usuarios'
import Perfiles from './pages/Gestion/Perfiles/Perfiles'
import RolesPermisos from './pages/Gestion/RolesPermisos/RolesPermisos'
import Catalogos from './pages/Gestion/Catalogos/Catalogos'
import Organizaciones from './pages/Gestion/Organizaciones/Organizaciones'
import OrganizacionDetalle from './pages/Gestion/Organizaciones/OrganizacionDetalle'
import ProcesosSede from './pages/Gestion/Organizaciones/ProcesosSede'

/**
 * Rutas de la aplicación.
 *
 *  /login                    → pantalla de acceso
 *  /inicio                   → panel de bienvenida del usuario
 *  /calculos                 → asistente de cálculo de huella (hídrica / carbono)
 *  /reportes                 → reportes y analítica
 *  /configuracion            → preferencias de la plataforma
 *  /ayuda                    → centro de ayuda
 *  /guias                    → guías del cálculo y cruce con el proceso
 *  /perfil                   → información personal
 *  /perfil/notificaciones    → historial de notificaciones
 *  /perfil/seguridad         → seguridad de la cuenta
 *  /perfil/preferencias      → preferencias del usuario
 *  /gestion                  → primera vista de gestión permitida
 *  /gestion/usuarios         → gestión de usuarios
 *  /gestion/perfiles         → gestión de perfiles
 *  /gestion/roles-permisos   → roles y permisos
 *  /gestion/organizaciones   → organizaciones, municipios y sedes
 *
 * Los proveedores globales (perfil, notificaciones y preferencias visuales)
 * viven aquí para que el estado esté compartido en todas las vistas.
 */
function RutaPrivada({ children }: { children: ReactNode }) {
  if (!leerToken()) return <Navigate to="/login" replace />
  return children
}

/** Bloquea una vista de gestión si el rol no tiene el permiso de consulta. */
function RutaConPermiso({ children }: { children: ReactNode }) {
  const { permisos, permisosListos } = usePerfil()
  const { pathname } = useLocation()
  const codigo = codigoDeRuta(pathname)
  if (!leerToken()) return <Navigate to="/login" replace />
  if (!permisosListos) return null
  if (!puedeEntrar(permisos, codigo)) return <Navigate to="/inicio" replace />
  return children
}

function EntradaGestion() {
  const { permisos, permisosListos } = usePerfil()
  if (!leerToken()) return <Navigate to="/login" replace />
  if (!permisosListos) return null
  return <Navigate to={destinoGestion(permisos)} replace />
}

function App() {
  return (
    <BrowserRouter>
      <PreferenciasProvider>
        <PerfilProvider>
          <NotificacionesProvider>
            <AvisoProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/inicio" element={<RutaPrivada><Inicio /></RutaPrivada>} />
                <Route path="/calculos" element={<RutaPrivada><Calculos /></RutaPrivada>} />
                <Route path="/reportes" element={<RutaPrivada><Reportes /></RutaPrivada>} />
                <Route path="/configuracion" element={<RutaPrivada><Configuracion /></RutaPrivada>} />
                <Route path="/ayuda" element={<RutaPrivada><Ayuda /></RutaPrivada>} />
                <Route path="/guias" element={<RutaPrivada><Guias /></RutaPrivada>} />

                <Route path="/perfil" element={<RutaPrivada><Perfil /></RutaPrivada>}>
                  <Route index element={<SeccionPerfil />} />
                  <Route path="notificaciones" element={<SeccionNotificaciones />} />
                  <Route path="seguridad" element={<SeccionSeguridad />} />
                  <Route path="preferencias" element={<SeccionPreferencias />} />
                </Route>

                <Route path="/gestion" element={<EntradaGestion />} />
                <Route path="/gestion/usuarios" element={<RutaConPermiso><Usuarios /></RutaConPermiso>} />
                <Route path="/gestion/perfiles" element={<RutaConPermiso><Perfiles /></RutaConPermiso>} />
                <Route path="/gestion/roles-permisos" element={<RutaConPermiso><RolesPermisos /></RutaConPermiso>} />
                <Route path="/gestion/organizaciones" element={<RutaConPermiso><Organizaciones /></RutaConPermiso>} />
                <Route path="/gestion/catalogos" element={<RutaConPermiso><Catalogos /></RutaConPermiso>} />
                <Route path="/gestion/organizaciones/:id/sedes/:sedeId" element={<RutaConPermiso><ProcesosSede /></RutaConPermiso>} />
                <Route path="/gestion/organizaciones/:id" element={<RutaConPermiso><OrganizacionDetalle /></RutaConPermiso>} />

                <Route path="/" element={<Landing />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </AvisoProvider>
          </NotificacionesProvider>
        </PerfilProvider>
      </PreferenciasProvider>
    </BrowserRouter>
  )
}

export default App
