import { createContext } from 'react';

export const ShopContext = createContext({
    addToCart: () => {},
    deleteFromCart: () => {},
    clearCart: () => {}
});
