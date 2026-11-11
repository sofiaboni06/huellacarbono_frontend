import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AvisoProvider } from './components/layout/PlantillaVista'
import { NotificacionesProvider } from './context/NotificacionesContext'
import { PerfilProvider } from './context/PerfilContext'
import { PreferenciasProvider } from './context/PreferenciasContext'
import Login from './pages/Login/Login'
import Inicio from './pages/Inicio/Inicio'
import Calculos from './pages/Calculos/Calculos'
import Reportes from './pages/Reportes/Reportes'
import Configuracion from './pages/Configuracion/Configuracion'
import Ayuda from './pages/Ayuda/Ayuda'
import Perfil from './pages/Perfil/Perfil'
import SeccionPerfil from './pages/Perfil/SeccionPerfil'
import SeccionNotificaciones from './pages/Perfil/SeccionNotificaciones'
import SeccionSeguridad from './pages/Perfil/SeccionSeguridad'
import SeccionPreferencias from './pages/Perfil/SeccionPreferencias'
import Usuarios from './pages/Gestion/Usuarios/Usuarios'
import Perfiles from './pages/Gestion/Perfiles/Perfiles'
import RolesPermisos from './pages/Gestion/RolesPermisos/RolesPermisos'

/**
 * Rutas de la aplicación.
 *
 *  /login                    → pantalla de acceso (demo, sin backend real)
 *  /inicio                   → panel de bienvenida del usuario
 *  /calculos                 → asistente de cálculo de huella (hídrica / carbono)
 *  /reportes                 → reportes y analítica
 *  /configuracion            → preferencias de la plataforma
 *  /ayuda                    → centro de ayuda
 *  /perfil                   → información personal
 *  /perfil/notificaciones    → historial de notificaciones
 *  /perfil/seguridad         → seguridad de la cuenta
 *  /perfil/preferencias      → preferencias del usuario
 *  /gestion                  → redirige a /gestion/usuarios
 *  /gestion/usuarios         → gestión de usuarios
 *  /gestion/perfiles         → gestión de perfiles
 *  /gestion/roles-permisos   → roles y permisos
 *
 * Los proveedores globales (perfil, notificaciones y preferencias visuales)
 * viven aquí para que el estado esté compartido en todas las vistas.
 */
function App() {
  return (
    <BrowserRouter>
      <PreferenciasProvider>
        <PerfilProvider>
          <NotificacionesProvider>
            <AvisoProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/inicio" element={<Inicio />} />
                <Route path="/calculos" element={<Calculos />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="/configuracion" element={<Configuracion />} />
                <Route path="/ayuda" element={<Ayuda />} />

                <Route path="/perfil" element={<Perfil />}>
                  <Route index element={<SeccionPerfil />} />
                  <Route path="notificaciones" element={<SeccionNotificaciones />} />
                  <Route path="seguridad" element={<SeccionSeguridad />} />
                  <Route path="preferencias" element={<SeccionPreferencias />} />
                </Route>

                <Route path="/gestion" element={<Navigate to="/gestion/usuarios" replace />} />
                <Route path="/gestion/usuarios" element={<Usuarios />} />
                <Route path="/gestion/perfiles" element={<Perfiles />} />
                <Route path="/gestion/roles-permisos" element={<RolesPermisos />} />

                <Route path="/" element={<Navigate to="/login" replace />} />
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
