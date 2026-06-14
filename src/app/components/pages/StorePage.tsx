import { useState } from "react";
import { useApp, Product } from "../../context/AppContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { ShoppingCart, Search } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "../figma/ImageWithFallback";


// --- COMPONENTE PRINCIPAL ---

/**
 * Componente de página que renderiza el catálogo general de la tienda.
 * Permite realizar búsquedas por texto y filtrados dinámicos por categorías y subcategorías.
 */
export function StorePage() {
  const { products, addToCart, user } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas las categorías");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("Todas");

  // Evitar duplicados obteniendo un conjunto de categorías únicas de los productos activos
  const uniqueCategories = Array.from(
    new Set(products.map((product) => product.category).filter(Boolean))
  );
  const categories = ["Todas las categorías", ...uniqueCategories];

  // Filtrar subcategorías dinámicamente según la categoría seleccionada por el usuario
  const uniqueSubcategories = selectedCategory !== "Todas las categorías"
    ? Array.from(
        new Set(
          products
            .filter((product) => product.category === selectedCategory)
            .map((product) => product.subcategory)
            .filter(Boolean)
        )
      )
    : [];
  const subcategories = ["Todas", ...uniqueSubcategories];

  // Aplicar criterios de búsqueda de texto, categoría y subcategoría de forma simultánea
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todas las categorías" || product.category === selectedCategory;
    const matchesSubcategory = selectedSubcategory === "Todas" || product.subcategory === selectedSubcategory;
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  // Restablecer el filtro de subcategoría al cambiar la categoría padre
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory("Todas");
  };

  // Validar sesión activa y disponibilidad de existencias antes de modificar el carrito
  const handleAddToCart = (product: Product) => {
    if (!user) {
      toast.error("Por favor inicia sesión para agregar productos al carrito");
      return;
    }
    if (product.stock === 0) {
      toast.error("Producto sin stock");
      return;
    }
    addToCart(product, 1);
    toast.success(`${product.name} agregado al carrito`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold catalog-title">Catálogo de Productos</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: '#F08781' }} />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 shadow-sm"
              style={{ borderColor: '#C2EDE1', backgroundColor: '#ffffff' }}
            />
          </div>

          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-[220px] border-2 shadow-sm" style={{ borderColor: '#F0C2A4', backgroundColor: '#ffffff' }}>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Renderizar el selector de subcategorías condicionalmente si existen elementos válidos */}
          {selectedCategory !== "Todas las categorías" && uniqueSubcategories.length > 0 && (
            <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
              <SelectTrigger className="w-full sm:w-[200px] border-2 shadow-sm" style={{ borderColor: '#F08781', backgroundColor: '#ffffff' }}>
                <SelectValue placeholder="Subcategoría" />
              </SelectTrigger>
              <SelectContent>
                {subcategories.map((subcategory) => (
                  <SelectItem key={subcategory} value={subcategory}>
                    {subcategory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="flex flex-col hover:shadow-lg transition-all duration-300 border-2 hover:border-[#F0C2A4]">
            <CardHeader className="p-0">
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-2">
              <div className="mb-1">
                <CardTitle className="text-sm line-clamp-1 product-name">{product.name}</CardTitle>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="outline" className="text-[10px] px-1 py-0">{product.subcategory}</Badge>
                  <Badge
                    variant={product.stock > product.lowStockThreshold ? "secondary" : "destructive"}
                    className="text-[10px] px-1 py-0"
                    style={{ backgroundColor: product.stock > product.lowStockThreshold ? '#C2EDE1' : undefined, color: product.stock > product.lowStockThreshold ? '#000000' : undefined }}
                  >
                    {product.stock}
                  </Badge>
                </div>
              </div>
              <CardDescription className="line-clamp-2 text-xs mb-1">
                {product.description}
              </CardDescription>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">MXN ${product.price.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="p-2 pt-0">
              <Button
                className="w-full text-xs h-8"
                size="sm"
                onClick={() => handleAddToCart(product)}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="size-3 mr-1" />
                {product.stock === 0 ? "Sin Stock" : "Agregar"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Mostrar un mensaje de retroalimentación si el resultado de los filtros es vacío */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron productos</p>
        </div>
      )}
    </div>
  );
}