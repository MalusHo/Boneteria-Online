import { useState } from "react";
import { useNavigate } from "react-router";
import { useApp } from "../../context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CheckoutPage() {
  const { cart, createOrder, user } = useApp();
  const navigate = useNavigate();
  const [pickupStore, setPickupStore] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado para controlar la carga

  if (!user) {
    navigate("/login");
    return null;
  }

  if (cart.length === 0) {
    navigate("/cart");
    return null;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = subtotal;

  const stores = [
    "Bonetería El Combate Centro - Av. Principal 123",
    "Bonetería El Combate Norte - Plaza del Norte Local 45",
    "Bonetería El Combate Sur - Centro Comercial Sur Piso 2",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pickupStore) {
      toast.error("Por favor selecciona una tienda para recoger");
      return;
    }

    setIsSubmitting(true);

    try {
      // Llamada asíncrona a Firestore
      await createOrder({
        items: cart,
        total,
        deliveryMethod: "pickup",
        pickupStore,
        status: "pending",
      });

      toast.success("¡Pedido realizado con éxito!");
      navigate("/orders");
    } catch (error) {
      console.error(error);
      toast.error("Hubo un problema al procesar tu pedido. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Finalizar Compra</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Selecciona una Tienda</CardTitle>
              <CardDescription>Recoge tu pedido en la tienda de tu preferencia</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={pickupStore} onValueChange={setPickupStore} required>
                <SelectTrigger disabled={isSubmitting}>
                  <SelectValue placeholder="Selecciona una tienda" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store} value={store}>
                      {store}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-3">
                Tu pedido estará listo para recoger en 1-2 días hábiles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Método de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-4 border rounded-lg">
                <CreditCard className="size-5" />
                <span>Pago en tienda al recoger</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Paga en efectivo o con tarjeta al momento de recoger tu pedido en la tienda seleccionada.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span>MXN ${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>MXN ${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#2ec4b6]">
                  <span>Recogida en tienda</span>
                  <span>Gratis</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total a Pagar</span>
                <span>MXN ${total.toFixed(2)}</span>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Confirmar Pedido"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}