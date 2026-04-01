import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const useOnlineCount = () => {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const socket = io('http://localhost:3000', {
      transports: ['websocket'],
    });

    socket.on('clientOnlineAck', (message: string) => {
      console.log('Received message from server useOnlineCount:', message);
      const count = parseInt(message);
      if (!isNaN(count)) {
        setOnlineCount(count);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { onlineCount };
};
