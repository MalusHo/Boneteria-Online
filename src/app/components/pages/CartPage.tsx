import { useNavigate } from "react-router";
import { useApp } from "../../context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";


// --- COMPONENTE PRINCIPAL ---

/**
 * Componente de página que renderiza el carrito de compras del usuario.
 * Permite visualizar los productos seleccionados, modificar sus cantidades
 * respetando el límite de existencias, eliminar artículos y proceder al pago.
 */
export function CartPage() {
  const { cart, removeFromCart, updateCartQuantity, user } = useApp();
  const navigate = useNavigate();

  // Restringir el acceso a la vista si no se ha detectado una sesión activa
  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Por favor inicia sesión para ver tu carrito</p>
        <Button onClick={() => navigate("/login")}>Iniciar Sesión</Button>
      </div>
    );
  }

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Mostrar una pantalla vacía opcional con llamado a la acción si el carrito no tiene elementos
  if (cart.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="size-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Tu carrito está vacío</h2>
        <p className="text-muted-foreground mb-4">Agrega algunos productos para empezar</p>
        <Button onClick={() => navigate("/")}>Ver Productos</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Carrito de Compras</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Desplegar la lista de productos actualmente agregados al carrito */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <Card key={item.product.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <ImageWithFallback
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                      {item.product.description}
                    </p>
                    <p className="text-lg font-bold">MXN ${item.product.price.toFixed(2)}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="size-3" />
                      </Button>
                      
                      <Input
                        type="number"
                        min="1"
                        max={item.product.stock}
                        value={item.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          
                          // Evitar que el cliente solicite una cantidad superior al stock real en Firestore
                          updateCartQuantity(item.product.id, Math.min(value, item.product.stock));
                        }}
                        className="w-16 text-center"
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground font-medium">
                      Subtotal: MXN ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Panel lateral fijo con el desglose y resumen financiero de la compra */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>MXN ${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Recogida en tienda</span>
                <span className="text-emerald-600">Gratis</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total a Pagar</span>
                  <span>MXN ${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0">
              <Button className="w-full" size="lg" onClick={() => navigate("/checkout")}>
                Pagar
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}