import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../../config/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  where,
  addDoc,
  runTransaction,
  updateDoc
} from "firebase/firestore";


// --- INTERFACES DE DATOS ---

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: "admin" | "user";
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  stock: number;
  image: string;
  lowStockThreshold: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: "pending" | "processing" | "ready-for-pickup" | "completed";
  deliveryMethod: "pickup" | "home";
  pickupStore?: string;
  deliveryAddress?: string;
  createdAt: Date;
}

interface AppContextType {
  user: UserProfile | null;
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  createOrder: (orderData: Omit<Order, "id" | "userId" | "createdAt">) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>;
  isEmailVerified: boolean;
  resendVerification: () => Promise<void>;
  checkVerificationStatus: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}


// --- CONTEXTO Y PROVIDER ---

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Proveedor de contexto global que centraliza el estado de la sesión de usuario,
 * sincronización en tiempo real del catálogo de productos, órdenes de compra
 * y persistencia transaccional del carrito.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Sincronizar el estado de autenticación y mapear el perfil extendido desde Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Almacenar el estado de verificación nativo provisto por el proveedor de Auth
        setIsEmailVerified(firebaseUser.emailVerified);

        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUser({
            uid: firebaseUser.uid,
            ...userDoc.data()
          } as UserProfile);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
        setIsEmailVerified(false);
        setOrders([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Mantener una escucha activa en tiempo real de la colección de productos para actualizar el catálogo
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(docs);
    });

    return () => unsubscribe();
  }, []);

  // Escuchar modificaciones en pedidos aplicando segmentación de documentos según el rol de la sesión
  useEffect(() => {
    if (!user) return;

    let ordersQuery = collection(db, "orders");
    
    // Restringir la consulta si el usuario no cuenta con atribuciones de administrador
    if (user.role !== "admin") {
      ordersQuery = query(collection(db, "orders"), where("userId", "==", user.uid)) as any;
    }

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const docs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() ? data.createdAt.toDate() : new Date()
        };
      }) as Order[];
      
      // Organizar cronológicamente los registros de forma descendente
      docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setOrders(docs);
    });

    return () => unsubscribe();
  }, [user]);

  // Autenticar credenciales de usuarios existentes mediante Firebase Auth
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Dar de alta nuevos usuarios, disparar correo de verificación y persistir su perfil operacional
  const signup = async (name: string, email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    await sendEmailVerification(firebaseUser);

    const profileData: Omit<UserProfile, "uid"> = {
      name,
      email,
      role: "user"
    };

    await setDoc(doc(db, "users", firebaseUser.uid), profileData);
    
    // Mantener la sesión activa temporalmente para permitir el flujo de la vista de bloqueo por verificación
    setUser({ uid: firebaseUser.uid, ...profileData });
    setIsEmailVerified(false);
  };

  // Finalizar la sesión actual del cliente y limpiar el estado de memoria del carrito local
  const logout = async () => {
    await signOut(auth);
    setCart([]);
  };

  // Reenviar el enlace de validación al buzón del usuario actualmente en proceso de registro
  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    } else {
      throw new Error("No hay un usuario activo.");
    }
  };

  // Forzar la actualización del token de seguridad para validar el estatus del email del usuario
  const checkVerificationStatus = async () => {
    if (auth.currentUser) {
      // Sincronizar el estado del usuario recargando los atributos del proveedor
      await auth.currentUser.reload();
      
      // Renovar los claims del token para asegurar que las reglas de seguridad de Firestore no rechacen las peticiones
      await auth.currentUser.getIdToken(true); 

      setIsEmailVerified(auth.currentUser.emailVerified);
    }
  };

  // Incorporar un producto al carrito controlando que no exceda las existencias reales
  const addToCart = (product: Product, quantity: number) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const newCart = [...prevCart];
        const newQuantity = newCart[existingIndex].quantity + quantity;
        newCart[existingIndex].quantity = Math.min(newQuantity, product.stock);
        return newCart;
      }
      return [...prevCart, { product, quantity: Math.min(quantity, product.stock) }];
    });
  };

  // Remover por completo un artículo del listado del carrito actual
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Vaciar la totalidad de los artículos del carrito
  const clearCart = () => setCart([]);

  // Modificar de forma explícita el número de piezas deseadas para un artículo del carrito
  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  // Registrar un pedido garantizando la atomicidad del stock mediante transacciones de Firestore
  const createOrder = async (orderData: Omit<Order, "id" | "userId" | "createdAt">) => {
    if (!user) throw new Error("Debes iniciar sesión para comprar");

    await runTransaction(db, async (transaction) => {
      const stocksToUpdate: { productRef: any; newStock: number }[] = [];

      // Fase de Lectura (Reads): Validar existencias de cada artículo de forma aislada
      for (const item of orderData.items) {
        const productRef = doc(db, "products", item.product.id);
        const productSnap = await transaction.get(productRef);

        if (!productSnap.exists()) {
          throw new Error(`El producto ${item.product.name} ya no existe.`);
        }

        const currentStock = productSnap.data()?.stock ?? 0;
        
        if (currentStock < item.quantity) {
          throw new Error(`No hay suficiente inventario disponible para ${item.product.name}.`);
        }

        // Retener temporalmente los cálculos en memoria para cumplir la restricción secuencial de la transacción
        stocksToUpdate.push({
          productRef,
          newStock: currentStock - item.quantity
        });
      }

      // Fase de Escritura (Writes): Actualizar de manera simultánea los inventarios modificados
      for (const update of stocksToUpdate) {
        transaction.update(update.productRef, {
          stock: update.newStock
        });
      }

      // Generar el documento final que representa la orden de compra aprobada
      const orderRef = doc(collection(db, "orders"));
      transaction.set(orderRef, {
        ...orderData,
        userId: user.uid,
        createdAt: new Date()
      });
    });

    clearCart();
  };

  // Modificar el estatus logístico y operacional de una orden específica
  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status });
  };

  /**
   * Envía un correo electrónico de restablecimiento de contraseña utilizando Firebase Auth.
   * @param email Dirección de correo del usuario que solicita la recuperación.
   */
  const resetPassword = async (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        products,
        cart,
        orders,
        loading,
        login,
        signup,
        logout,
        addToCart,
        removeFromCart,
        clearCart,
        updateCartQuantity,
        resetPassword,
        createOrder,
        updateOrderStatus,
        isEmailVerified,
        resendVerification,
        checkVerificationStatus
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook personalizado para consumir de manera segura el contexto global de la aplicación.
 */
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp debe usarse dentro de un AppProvider");
  }
  return context;
}