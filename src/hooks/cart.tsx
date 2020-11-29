import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsGetted = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsGetted) {
        setProducts(JSON.parse(productsGetted));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async (id: string) => {
      const updatedProducts = [...products];
      const product = updatedProducts.find(p => p.id === id);

      if (!product) {
        return;
      }

      product.quantity += 1;

      setProducts(updatedProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const updatedProducts = [...products];
      const existingProduct = updatedProducts.find(p => p.id === product.id);

      if (existingProduct) {
        increment(existingProduct.id);
        return;
      }

      updatedProducts.push({ ...product, quantity: 1 });

      setProducts(updatedProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products, increment],
  );

  const decrement = useCallback(
    async (id: string) => {
      const updatedProducts = [...products];
      const productIndex = updatedProducts.findIndex(p => p.id === id);

      if (productIndex === -1) {
        return;
      }

      const product = updatedProducts[productIndex];

      product.quantity -= 1;

      if (product.quantity === 0) {
        updatedProducts.splice(productIndex, 1);
      }

      setProducts(updatedProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
