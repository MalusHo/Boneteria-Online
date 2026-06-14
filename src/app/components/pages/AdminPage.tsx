import { useState } from "react";
import { useApp, Product, Order } from "../../context/AppContext";
import { db } from "../../../config/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Plus, Edit2, Trash2, Package, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";


// --- COMPONENTE PRINCIPAL ---

/**
 * Componente de página para el panel de administración de la plataforma.
 * Proporciona interfaces de control para la gestión del inventario global (CRUD de productos)
 * y la actualización del estado logístico de los pedidos de la tienda en Firestore.
 */
export function AdminPage() {
  const { products, orders, user, updateOrderStatus } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados locales para el control y persistencia de campos del formulario de productos
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [stock, setStock] = useState("");
  const [image, setImage] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");

  // Validar credenciales de sesión y privilegios de rol para impedir accesos no autorizados
  if (!user || user.role !== "admin") {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive">Acceso Denegado</h2>
        <p className="text-muted-foreground">No tienes permisos para ver esta sección.</p>
      </div>
    );
  }

  // Restablecer los estados del formulario a sus valores iniciales por defecto
  const resetForm = () => {
    setEditingProduct(null);
    setName("");
    setDescription("");
    setPrice("");
    setCategory("");
    setSubcategory("");
    setStock("");
    setImage("");
    setLowStockThreshold("5");
  };

  // Cargar la información del producto seleccionado en los estados del formulario para su modificación
  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setCategory(product.category);
    setSubcategory(product.subcategory);
    setStock(product.stock.toString());
    setImage(product.image);
    setLowStockThreshold(product.lowStockThreshold.toString());
  };

  // Procesar el envío del formulario para la creación o actualización de registros en Firestore
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const productData = {
      name,
      description,
      price: parseFloat(price),
      category,
      subcategory,
      stock: parseInt(stock),
      image: image || "",
      lowStockThreshold: parseInt(lowStockThreshold),
    };

    try {
      if (editingProduct) {
        // Actualizar de forma directa el documento existente del producto mediante su UID
        const productRef = doc(db, "products", editingProduct.id);
        await updateDoc(productRef, productData);
        toast.success("Producto actualizado correctamente");
      } else {
        // Registrar un nuevo documento de producto dentro de la colección global
        await addDoc(collection(db, "products"), productData);
        toast.success("Producto creado con éxito");
      }
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el producto");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remover de forma permanente el documento del producto seleccionado en la base de datos
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    try {
      await deleteDoc(doc(db, "products", id));
      toast.success("Producto eliminado");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el producto");
    }
  };

  // Modificar el estado del pedido coordinando la actualización con el contexto de la aplicación
  const handleStatusChange = async (orderId: string, status: Order["status"]) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Pedido #${orderId} actualizado a ${status}`);
    } catch (error) {
      console.error(error);
      toast.error("Error al cambiar el estado del pedido");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Panel de Administración</h1>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="size-4" /> Productos
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingBag className="size-4" /> Pedidos ({orders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario operativo de Altas y Modificaciones de catálogo */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>{editingProduct ? "Editar Producto" : "Agregar Producto"}</CardTitle>
              <CardDescription>Completa los datos del inventario</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="desc">Descripción</Label>
                  <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="price">Precio (MXN)</Label>
                    <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="stock">Stock Inicial</Label>
                    <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="category">Categoría</Label>
                    <Input id="category" placeholder="Ej: Caballero" value={category} onChange={(e) => setCategory(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sub">Subcategoría</Label>
                    <Input id="sub" placeholder="Ej: Casual" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="image">URL de Imagen</Label>
                  <Input id="image" placeholder="https://..." value={image} onChange={(e) => setImage(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="threshold">Alerta Stock Bajo</Label>
                  <Input id="threshold" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} required />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : editingProduct ? "Guardar" : "Agregar"}
                  </Button>
                  {editingProduct && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Tabla informativa del estado actual del inventario */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Inventario Global</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category} ({product.subcategory})</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={product.stock > product.lowStockThreshold ? "secondary" : "destructive"}>
                          {product.stock} pzas
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="icon" variant="ghost" className="size-8" onClick={() => handleEditClick(product)}>
                          <Edit2 className="size-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-8 text-destructive" onClick={() => handleDeleteProduct(product.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Control logístico y desglose operacional de pedidos */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Pedido</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Productos y Entrega</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado Actual</TableHead>
                    <TableHead className="text-right">Cambiar Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="align-top">
                      <TableCell className="font-mono text-xs pt-4">#{order.id}</TableCell>
                      <TableCell className="pt-4">{order.createdAt.toLocaleDateString()}</TableCell>
                      
                      <TableCell className="pt-4">
                        <div className="space-y-2">
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="text-xs text-muted-foreground">
                                • <span className="font-medium text-foreground">{item.product.name}</span> 
                                <span className="ml-1 font-semibold text-primary">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="text-[11px] pt-1.5 border-t border-dashed">
                            {order.deliveryMethod === "home" ? (
                              <div>
                                <span className="font-medium text-amber-600">Envío a Domicilio:</span>
                                <p className="text-muted-foreground mt-0.5">{order.deliveryAddress || "No especificada"}</p>
                              </div>
                            ) : (
                              <div>
                                <span className="font-medium text-blue-600">Recoger en Tienda:</span>
                                <p className="text-muted-foreground mt-0.5">{order.pickupStore || "No especificada"}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="font-semibold pt-4">${order.total.toFixed(2)}</TableCell>
                      <TableCell className="pt-4">
                        <Badge>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right pt-3">
                        <Select defaultValue={order.status} onValueChange={(val: Order["status"]) => handleStatusChange(order.id, val)}>
                          <SelectTrigger className="w-[180px] ml-auto h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="processing">Procesando</SelectItem>
                            <SelectItem value="ready-for-pickup">Listo para Recoger</SelectItem>
                            <SelectItem value="completed">Completado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}