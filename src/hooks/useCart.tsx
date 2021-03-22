import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
      const findIndex = cart.findIndex((product) => {
        return product.id === productId;
      })

      if(findIndex === -1){
        try{
          const { data } = await api.get(`products/${productId}`)

          if (data !== {}){
            const newProduct = {
              id: data.id,
              title: data.title,
              price: data.price,
              image: data.image,
              amount: 1,
            }
    
            const newCart = [...cart, newProduct];
    
            setCart(newCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
          } 
        } catch {
          toast.error('Erro na adição do produto');
        }
          
      } else {
        const product = cart.filter((product) => {
          return product.id === productId;
        })

        if(product[0]){
          const { data } = await api.get<Stock>(`stock/${productId}`)
          if(data.amount >= product[0].amount + 1){
            updateProductAmount({productId, amount: product[0].amount + 1})
          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }
        } else {
          toast.error('Erro na adição do produto');
        }
      }
  };

  const removeProduct = (productId: number) => {
      const findIndex = cart.findIndex((product) => {
        return product.id === productId;
      })

      if(findIndex !== -1){
        const newCart = cart.filter((product) => {
          return product.id !== productId;
        })

        setCart([...newCart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
         
      } else {
        toast.error('Erro na remoção do produto');
      }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {

    try {
      const { data } = await api.get<Stock>(`stock/${productId}`);

      if(amount <= 0) return;

      if(data.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');

        return;
      }

      const findIndex = cart.findIndex((product) => {
        return product.id === productId;
      });

      const updatedCart = cart;
      updatedCart[findIndex].amount = amount;
            
      setCart([...updatedCart]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
