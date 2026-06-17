import { RouterProvider } from "react-router";
import { AppProvider, useApp } from "./context/AppContext";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { auth } from "../config/firebase";


// --- COMPONENTE INTERNO ---

/**
 * Componente secundario que evalúa el estado de autenticación y la verificación
 * del correo electrónico del usuario para restringir o permitir el acceso a las rutas.
 */
function AppContent() {
  const { user, isEmailVerified, resendVerification, checkVerificationStatus, logout, loading } = useApp();

  // Mostrar pantalla de carga provisional mientras se determina el estado de la sesión
  if (loading) {
    return (
      <div style={{ backgroundColor: "#111827", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "sans-serif" }}>
        <p>Cargando tienda...</p>
      </div>
    );
  }

  // Restringir el acceso total a las rutas si el usuario no ha verificado su cuenta
  if (user && !isEmailVerified) {
    return (
      <div style={{
        position: "fixed", inset: 0, backgroundColor: "#111827", color: "white",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        zIndex: 9999, padding: "20px", fontFamily: "sans-serif"
      }}>
        <div style={{ backgroundColor: "#1f2937", padding: "30px", borderRadius: "12px", textAlign: "center", maxWidth: "400px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "10px", fontWeight: "bold" }}>¡Verifica tu cuenta!</h2>
          <p style={{ color: "#9ca3af", marginBottom: "20px", lineHeight: "1.5" }}>
            Hola <strong>{user.name}</strong>, enviamos un enlace de confirmación a <strong>{user.email}</strong>. 
            Debes verificarlo para poder acceder a la tienda.(Revisa tu bandeja de entrada o la carpeta de spam) Si no recibiste el correo, puedes solicitar otro enlace de verificación.
          </p>

          <button 
            onClick={async () => {
              await checkVerificationStatus();
              // Notificar al usuario basándose en el estado actualizado en Firebase Authentication
              if (auth.currentUser?.emailVerified) {
                toast.success("¡Cuenta verificada con éxito!");
              } else {
                toast.error("Parece que aún no has hecho clic en el enlace.");
              }
            }}
            style={{ width: "100%", padding: "12px", backgroundColor: "#3b82f6", color: "white", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", marginBottom: "10px" }}
          >
            Ingresar
          </button>

          <button 
            onClick={async () => {
              try {
                await resendVerification();
                toast.success("Te hemos reenviado el enlace de verificación.");
              } catch (err) {
                // Evitar saturación de peticiones controlando el error del reenvío inmediato
                toast.error("Espera un momento antes de solicitar otro correo.");
              }
            }}
            style={{ width: "100%", padding: "12px", backgroundColor: "#4b5563", color: "white", borderRadius: "6px", border: "none", cursor: "pointer", marginBottom: "10px" }}
          >
            Reenviar correo de verificación
          </button>

          <button 
            onClick={() => logout()}
            style={{ width: "100%", padding: "12px", backgroundColor: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginBottom: "15px" }}
          >
            Salir / Usar otra cuenta
          </button>

          {/* Enlace rápido de acceso directo */}
          <a href="/credits" style={{ color: "#9ca3af", textDecoration: "underline", fontSize: "14px" }}>
            Ver créditos del equipo de desarrollo
          </a>
        </div>
      </div>
    );
  }

  // Permitir el flujo normal de navegación si pasa de forma segura las validaciones anteriores
  return <RouterProvider router={router} />;
}


// --- COMPONENTE PRINCIPAL ---

/**
 * Raíz de la aplicación que se encarga de inicializar los proveedores
 * globales de contexto y el manejador de notificaciones visuales (Toaster).
 */
export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <Toaster />
    </AppProvider>
  );
}