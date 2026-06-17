import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { useApp } from "../../context/AppContext";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, ArrowLeft, Loader2, MailCheck } from "lucide-react";

// --- COMPONENTE PRINCIPAL ---

/**
 * Componente de página que renderiza el formulario de recuperación de contraseña.
 * Solicita el correo del usuario, delega el envío del token de seguridad a Firebase Auth
 * y mapea posibles errores del servidor de manera comprensible.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resetPassword } = useApp();
  const navigate = useNavigate();

  // Procesar el envío del formulario para la solicitud de restablecimiento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Invocar la función del contexto global conectada a Firebase Auth
      await resetPassword(email);
      setIsSent(true);
    } catch (err: any) {
      console.error(err);

      // Mapear los códigos de error técnicos de Firebase a mensajes operacionales legibles
      if (err.code === "auth/user-not-found") {
        setError("No existe ninguna cuenta registrada con este correo electrónico.");
      } else if (err.code === "auth/invalid-email") {
        setError("El formato del correo electrónico no es válido.");
      } else {
        setError("Ocurrió un error al procesar la solicitud. Intenta de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" disabled={isSubmitting}>
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <CardTitle>Recuperar Contraseña</CardTitle>
          </div>
          <CardDescription>
            Te enviaremos un enlace de verificación a tu correo para restablecer tus credenciales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Alternar la vista completa si el correo se depositó con éxito en el servidor */}
          {isSent ? (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 text-primary rounded-full">
                  <MailCheck className="size-10 text-[#2ec4b6]" />
                </div>
              </div>
              <h3 className="text-lg font-semibold">¡Correo de recuperación enviado!</h3>
              <p className="text-sm text-muted-foreground">
                Hemos enviado un mensaje a <span className="font-medium text-foreground">{email}</span> con las instrucciones necesarias.
              </p>
              <Button onClick={() => navigate("/login")} className="w-full mt-2">
                Volver al Inicio de Sesión
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Desplegar banner de alerta únicamente si existe un fallo en la solicitud */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Bloquear interacción concurrente durante el procesamiento asíncrono */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Enviando enlace...
                  </>
                ) : (
                  "Enviar Enlace"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}