import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../../config/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification
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
  isEmailVerified: boolean; // <-- NUEVO
  resendVerification: () => Promise<void>; // <-- NUEVO
  checkVerificationStatus: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false); // <-- NUEVO ESTADO

  // 1. Escuchar el estado de autenticación y cargar perfil de usuario
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Guardamos si ya está verificado directamente desde Firebase Auth
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

  // 2. Escuchar cambios en los productos (Tiempo Real)
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

  // 3. Escuchar cambios en los pedidos (Tiempo Real filtrado por Rol)
  useEffect(() => {
    if (!user) return;

    let ordersQuery = collection(db, "orders");
    
    // Si no es admin, solo traer sus propios pedidos
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
      
      // Ordenar por fecha descendente
      docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setOrders(docs);
    });

    return () => unsubscribe();
  }, [user]);

  // --- FUNCIONES DE AUTENTICACIÓN ---
const login = async (email: string, password: string) => {
    // Solo inicia sesión de forma normal, ya no lances errores aquí
    await signInWithEmailAndPassword(auth, email, password);
  };

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
    
    // Ya no deslogueamos aquí, dejamos que entre para que vea la pantalla de bloqueo
    setUser({ uid: firebaseUser.uid, ...profileData });
    setIsEmailVerified(false);
  };

  const logout = async () => {
    await signOut(auth);
    setCart([]);
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    } else {
      throw new Error("No hay un usuario activo.");
    }
  };

  const checkVerificationStatus = async () => {
    if (auth.currentUser) {
      // 1. Actualiza el estado del usuario localmente
      await auth.currentUser.reload();
      
      // Esto actualiza el token con 'email_verified: true' para que Firestore no lo rechace
      await auth.currentUser.getIdToken(true); 

      setIsEmailVerified(auth.currentUser.emailVerified);
    }
  };

  // --- GESTIÓN DEL CARRITO ---
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

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

// --- OPERACIONES DE PEDIDOS (CON TRANSACCIÓN DE FIRESTORE) ---
  const createOrder = async (orderData: Omit<Order, "id" | "userId" | "createdAt">) => {
    if (!user) throw new Error("Debes iniciar sesión para comprar");

    await runTransaction(db, async (transaction) => {
      // Arreglo temporal para guardar los cálculos y referencias de stock
      const stocksToUpdate: { productRef: any; newStock: number }[] = [];

      // 1.FASE DE LECTURA (READS) - Absolutamente todos los 'get' van aquí
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

        // En lugar de actualizar de inmediato, guardamos los datos calculados en memoria
        stocksToUpdate.push({
          productRef,
          newStock: currentStock - item.quantity
        });
      }

      // 2.FASE DE ESCRITURA (WRITES) - Ningún 'await transaction.get' permitido después de esta línea
      for (const update of stocksToUpdate) {
        transaction.update(update.productRef, {
          stock: update.newStock
        });
      }

      // 3. Generar el documento de la orden de compra (Escritura final)
      const orderRef = doc(collection(db, "orders"));
      transaction.set(orderRef, {
        ...orderData,
        userId: user.uid,
        createdAt: new Date()
      });
    });

    // Limpiamos el estado global del carrito una vez que la transacción fue exitosa
    clearCart();
  };

  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status });
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

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp debe usarse dentro de un AppProvider");
  }
  return context;
}