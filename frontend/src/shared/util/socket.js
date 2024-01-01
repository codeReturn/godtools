import { useEffect, useRef } from 'react';
import openSocket from 'socket.io-client';

const useSocket = () => {
  const socketRef = useRef();
  const user = JSON.parse(localStorage.getItem('userData'))

  const initSocket = async () => {
      const options = {
        transports: ['websocket', 'polling'],
        query: { userId: user?.userId },
        path: '/godtoolshost/socket.io/',
      };
      const socket = openSocket('http://localhost:5000', options);
      socketRef.current = socket;  
  };
  
  useEffect(() => {
    initSocket();
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return socketRef.current;
};

export default useSocket;