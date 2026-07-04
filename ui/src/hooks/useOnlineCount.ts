import { constants } from '@harrys-project/shared/constants';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const useOnlineCount = () => {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const socket = io('http://localhost:3000/presence', {
      transports: ['websocket'],
    });

    socket.on(constants.ws.presence.ONLINE_COUNT_EVENT, (total: number) => {
      setOnlineCount(total);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { onlineCount };
};
