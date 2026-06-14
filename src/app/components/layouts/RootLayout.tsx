import { Outlet, Link, useNavigate, useLocation } from "react-router";
import { ShoppingCart, User, Package, LogOut, Home } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useApp } from "../../context/AppContext";
import logo from "../../../imports/image-2.png";

export function RootLayout() {
  const { user, cart, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleHomeClick = () => {
    navigate("/");
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60" style={{ borderBottomColor: '#F0C2A4', borderBottomWidth: '3px' }}>
        <div className="container flex h-20 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Logo Bonetería El Combate" className="h-16 w-auto" />
            <span className="font-semibold text-2xl store-name">Bonetería El Combate</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleHomeClick}>
              <Home className="size-4 mr-2" />
              Inicio
            </Button>

            {user && (
              <>
                <Link to="/orders">
                  <Button variant="ghost" size="sm">
                    <Package className="size-4 mr-2" />
                    Mis Pedidos
                  </Button>
                </Link>

                {user.role === "admin" && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">
                      Administrador
                    </Button>
                  </Link>
                )}

                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="sm">
                    <ShoppingCart className="size-4 mr-2" />
                    Carrito
                    {cartItemsCount > 0 && (
                      <Badge className="ml-2 px-2 py-0.5 text-xs">
                        {cartItemsCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                <div className="flex items-center gap-2">
                  <User className="size-4" />
                  <span className="text-sm">{user.name}</span>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="size-4" />
                  </Button>
                </div>
              </>
            )}

            {!user && (
              <Link to="/login">
                <Button size="sm">
                  <User className="size-4 mr-2" />
                  Iniciar Sesión
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container py-6 px-4">
        <Outlet />
      </main>

      <footer className="border-t py-6 mt-12" style={{ borderTopColor: '#F0C2A4', borderTopWidth: '2px', backgroundColor: '#fafafa' }}>
        <div className="container px-4 text-center text-sm text-muted-foreground">
          © 2026 Bonetería El Combate. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
