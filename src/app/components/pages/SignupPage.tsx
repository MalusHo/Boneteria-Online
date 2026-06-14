import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { useApp } from "../../context/AppContext";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";


// --- COMPONENTE PRINCIPAL ---

/**
 * Componente de página que renderiza el formulario de registro de nuevos usuarios.
 * Gestiona la validación de credenciales de forma local y delega la creación de la 
 * cuenta al proveedor de servicios de autenticación.
 */
export function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useApp();
  const navigate = useNavigate();

  // Procesar el envío del formulario realizando validaciones previas antes del registro
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Garantizar que ambas contraseñas ingresadas por el usuario sean idénticas
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // Cumplir con la longitud mínima requerida por las políticas de seguridad de Firebase
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      await signup(name, email, password);
      navigate("/");
    } catch (err: any) {
      console.error(err);
      // Mapear los códigos de error técnicos de Firebase a mensajes legibles para el usuario
      if (err.code === "auth/email-already-in-use") {
        setError("Este email ya se encuentra registrado por otro usuario.");
      } else if (err.code === "auth/invalid-email") {
        setError("El formato del correo electrónico no es válido.");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña es muy débil. Intenta con una más segura.");
      } else {
        setError("Ocurrió un error al crear la cuenta. Intenta de nuevo.");
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
            <CardTitle>Crear Cuenta</CardTitle>
          </div>
          <CardDescription>
            Completa el formulario para registrarte en Bonetería El Combate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Desplegar banner de alerta únicamente si existe un mensaje de error activo */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Alternar el contenido del botón para dar retroalimentación visual de carga */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Crear Cuenta"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Inicia sesión aquí
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}