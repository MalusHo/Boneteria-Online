import { useNavigate } from "react-router";
import { useApp } from "../../context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Package, Home, Store, Calendar } from "lucide-react";
import { Button } from "../ui/button";


// --- COMPONENTE PRINCIPAL ---

/**
 * Componente de página que renderiza el historial de pedidos del usuario.
 * Si el usuario cuenta con el rol de administrador, la vista se adapta para 
 * desplegar el total de pedidos globales registrados en la plataforma.
 */
export function OrdersPage() {
  const { orders, user } = useApp();
  const navigate = useNavigate();

  // Restringir el acceso a la vista si no se ha detectado una sesión activa
  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Por favor inicia sesión para ver tus pedidos</p>
        <Button onClick={() => navigate("/login")}>Iniciar Sesión</Button>
      </div>
    );
  }

  // Evitar duplicación de consultas delegando el filtrado por usuario al AppContext y Firestore
  const userOrders = orders;

  // Determinar la variante visual del Badge según el estado de la orden
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      processing: "default",
      shipped: "default",
      delivered: "outline",
      "ready-for-pickup": "default",
      completed: "outline",
    };
    return variants[status] || "default";
  };

  // Traducir los identificadores técnicos de estados a etiquetas legibles en español
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendiente",
      processing: "Procesando",
      shipped: "Enviado",
      delivered: "Entregado",
      "ready-for-pickup": "Listo para Recoger",
      completed: "Completado",
    };
    return labels[status] || status;
  };

  // Mostrar una pantalla vacía opcional con llamado a la acción si no existen compras registradas
  if (userOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="size-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No tienes pedidos</h2>
        <p className="text-muted-foreground mb-4">Realiza tu primer pedido para verlo aquí</p>
        <Button onClick={() => navigate("/")}>Ver Productos</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {user.role === "admin" ? "Todos los Pedidos" : "Mis Pedidos"}
      </h1>

      <div className="space-y-4">
        {userOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Pedido #{order.id}
                    <Badge variant={getStatusBadge(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-4" />
                      {order.createdAt.toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      {order.deliveryMethod === "home" ? (
                        <>
                          <Home className="size-4" />
                          Entrega a domicilio
                        </>
                      ) : (
                        <>
                          <Store className="size-4" />
                          Recoger en tienda
                        </>
                      )}
                    </span>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">MXN ${order.total.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.items.length} {order.items.length === 1 ? "producto" : "productos"}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="font-medium">
                      MXN ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}

                {/* Desplegar la dirección de entrega únicamente si el método seleccionado es a domicilio */}
                {order.deliveryAddress && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium">Dirección de entrega:</p>
                    <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
                  </div>
                )}

                {/* Desplegar la sucursal de destino únicamente si el método seleccionado es recolección física */}
                {order.pickupStore && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium">Tienda de recogida:</p>
                    <p className="text-sm text-muted-foreground">{order.pickupStore}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}