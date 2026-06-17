import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { useApp } from "../../context/AppContext";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";


// --- COMPONENTE PRINCIPAL ---

/**
 * Componente de página que renderiza el formulario de inicio de sesión.
 * Permite a los usuarios autenticarse mediante sus credenciales de acceso,
 * procesando y homologando las excepciones emitidas por Firebase Auth.
 */
export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  // Gestionar el envío del formulario enviando las credenciales al servicio de autenticación
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      console.error(err);
      
      // Mapear excepciones técnicas comunes de Firebase Auth a un formato legible para el usuario
      if (
        err.code === "auth/invalid-credential" || 
        err.code === "auth/wrong-password" || 
        err.code === "auth/user-not-found"
      ) {
        setError("Correo o contraseña incorrectos.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Demasiados intentos fallidos. Cuenta bloqueada temporalmente.");
      } else {
        setError("Ocurrió un error al iniciar sesión. Intenta de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mostrar la alerta de retroalimentación únicamente si existe un fallo de autenticación */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs text-primary hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Alternar el estado visual del botón para prevenir peticiones concurrentes */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  o
                </span>
              </div>
            </div>

            <Link to="/signup" className="w-full block">
              <Button type="button" variant="outline" className="w-full" disabled={isSubmitting}>
                Crear Cuenta Nueva
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}