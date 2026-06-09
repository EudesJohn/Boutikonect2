import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'boutikonect_cart';
const MAX_QUANTITY_PER_ITEM = 99;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.price === 'number' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0 &&
        typeof item.stock === 'number'
    );
  } catch {
    return [];
  }
}

function persistCart(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to persist cart to localStorage:', err);
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadCartFromStorage());
  const [initialized, setInitialized] = useState(false);
  const initializedRef = useRef(false);

  // Sync to localStorage whenever items change (skip the initial hydrate)
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    persistCart(items);
  }, [items]);

  useEffect(() => {
    setInitialized(true);
  }, []);

  // ---------------------------------------------------------------------------
  // addToCart
  // ---------------------------------------------------------------------------
  const addToCart = useCallback(
    ({ id, title, price, stock = 99, image = '', sellerId = '', sellerName = '', sellerAvatar = '' }) => {
      if (!id || !title || price == null) {
        toast.error('Donnees produit invalides.');
        return;
      }

      setItems((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === id);

        if (existingIndex >= 0) {
          // Item already in cart -- increase quantity
          const existing = prev[existingIndex];
          const newQty = existing.quantity + 1;

          if (newQty > stock) {
            toast.error(`Stock insuffisant (${stock} disponible(s)).`);
            return prev;
          }

          if (newQty > MAX_QUANTITY_PER_ITEM) {
            toast.error(`Maximum ${MAX_QUANTITY_PER_ITEM} articles par produit.`);
            return prev;
          }

          const updated = [...prev];
          updated[existingIndex] = { ...existing, quantity: newQty };
          toast.success(`Quantite de "${title}" passee a ${newQty}.`);
          return updated;
        }

        // New item
        if (1 > stock) {
          toast.error('Ce produit est en rupture de stock.');
          return prev;
        }

        toast.success(`"${title}" ajoute au panier.`);
        return [
          ...prev,
          {
            id,
            title,
            price,
            quantity: 1,
            stock,
            image,
            sellerId,
            sellerName,
            sellerAvatar,
          },
        ];
      });
    },
    []
  );

  // ---------------------------------------------------------------------------
  // removeFromCart
  // ---------------------------------------------------------------------------
  const removeFromCart = useCallback((id) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        toast.success(`"${item.title}" retire du panier.`);
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  // ---------------------------------------------------------------------------
  // updateQuantity
  // ---------------------------------------------------------------------------
  const updateQuantity = useCallback(
    (id, newQuantity) => {
      if (newQuantity < 1) {
        // Treat as removal
        return removeFromCart(id);
      }

      setItems((prev) => {
        const existing = prev.find((item) => item.id === id);
        if (!existing) return prev;

        if (newQuantity > MAX_QUANTITY_PER_ITEM) {
          toast.error(`Maximum ${MAX_QUANTITY_PER_ITEM} articles par produit.`);
          return prev;
        }

        if (newQuantity > existing.stock) {
          toast.error(`Stock insuffisant (${existing.stock} disponible(s)).`);
          return prev;
        }

        return prev.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        );
      });
    },
    [removeFromCart]
  );

  // ---------------------------------------------------------------------------
  // clearCart
  // ---------------------------------------------------------------------------
  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Panier vide.');
  }, []);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const getCartTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const getCartCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  const cartTotal = useMemo(() => getCartTotal(), [getCartTotal]);
  const cartCount = useMemo(() => getCartCount(), [getCartCount]);

  // ---------------------------------------------------------------------------
  // Value bag
  // ---------------------------------------------------------------------------
  const value = useMemo(
    () => ({
      items,
      cartTotal,
      cartCount,
      initialized,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartCount,
    }),
    [
      items,
      cartTotal,
      cartCount,
      initialized,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartCount,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider.');
  }
  return context;
}

export default CartContext;
