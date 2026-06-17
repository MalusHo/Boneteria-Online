import { Users, Terminal, Code2, Cpu, Layers } from "lucide-react";

export function CreditsPage() {
  // Arreglo con los 5 integrantes del equipo
  const integrantes = [
    { nombre: "Luis Fernando Silva Briones", icono: Code2 },
    { nombre: "Juan Emmanuel Suarez Garcia", icono: Code2 },
    { nombre: "Valeria Itzel Trinidad González", icono: Layers },
    { nombre: "Katiana Naeroby Martínez Gurrola", icono: Layers },
    { nombre: "Ángel Isaac Castellanos Ruíz", icono: Layers },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="max-w-3xl w-full text-center space-y-8">
        
        {/* Cabecera */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full mb-2">
            <Users className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
            Equipo de Desarrollo
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            Este proyecto fue diseñado, estructurado y programado con dedicación por el siguiente equipo de desarrollo.
          </p>
        </div>

        {/* Grid de Integrantes al estilo Shadcn (Cards limpias) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
          {integrantes.map((integrante, index) => {
            const Icono = integrante.icono;
            return (
              <div 
                key={index} 
                className="flex items-center space-x-4 p-5 rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/30"
              >
                <div className="p-2.5 rounded-lg bg-muted text-muted-foreground">
                  <Icono className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-base tracking-tight text-foreground">
                    {integrante.nombre}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    Core Developer
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pie de página de créditos */}
        <div className="pt-8 text-xs text-muted-foreground tracking-wide uppercase font-medium">
          © 2026 • Todos los derechos reservados
        </div>

      </div>
    </div>
  );
}