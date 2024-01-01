import React, { useState, useEffect } from 'react';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});

export const useShopHook = () => {
  const listStorage = JSON.parse(localStorage.getItem('cart_list'));
  const [cartList, setCartList] = useState(listStorage || []);

  const addToCart = (id, quantity) => {
    const obj = {
      id: id,
      quantity: parseInt(quantity),
    };

    const find = cartList?.find((item) => item.id === id);
    if (find) {
      toast.error('Item is already in cart!', {
        position: toast.POSITION.BOTTOM_CENTER,
      });
      return;
    }

    setCartList((prevCartList) => [...prevCartList, obj]);
    localStorage.setItem('cart_list', JSON.stringify([...cartList, obj]));

    window.dispatchEvent(new Event('cartUpdated'));
  };

  const deleteFromCart = (id) => {
    const updatedCartList = cartList?.filter((item) => item.id !== id);
    setCartList(updatedCartList);
    localStorage.setItem('cart_list', JSON.stringify(updatedCartList));

    window.dispatchEvent(new Event('cartUpdated'));
  };

  const clearCart = () => {
    setCartList([]);
    localStorage.setItem('cart_list', JSON.stringify([]));

    window.dispatchEvent(new Event('cartUpdated'));
  };

  return { addToCart, deleteFromCart, clearCart };
};
