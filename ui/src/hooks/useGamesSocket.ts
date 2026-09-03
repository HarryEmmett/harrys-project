import { constants } from '@harrys-project/shared/constants';
import {
  codenamesSessionSchema,
  gameSchema,
} from '@harrys-project/shared/apiSchema';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../api/apiCalls';
import {
  updateCodenamesSessionInCache,
  updateGameInCache,
} from '../api/gamesCache';

// No rooms/join-leave here — with no per-question chat/reply feature (and no
// create-game flow) there's nothing left needing per-id scoping, so this just
// listens for global game-vote broadcasts on a single namespace.
export const useGamesSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const newSocket = io(`${apiUrl}/games`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on(constants.ws.CONNECT_EVENT, () => {
      console.log('Connected to WebSocket server');
    });

    socket.on(constants.ws.games.GAMES_UPDATED_EVENT, (wsData: unknown) => {
      const data = gameSchema.safeParse(wsData);

      if (data.success) {
        updateGameInCache(queryClient, data.data);
      } else {
        console.log('Invalid game data received:', data.error);
      }
    });

    socket.on(
      constants.ws.games.CODENAMES_SESSION_UPDATED_EVENT,
      (wsData: unknown) => {
        const data = codenamesSessionSchema.safeParse(wsData);

        if (data.success) {
          updateCodenamesSessionInCache(queryClient, data.data);
        } else {
          console.log('Invalid codenames session received:', data.error);
        }
      },
    );

    return () => {
      socket.off(constants.ws.CONNECT_EVENT);
      socket.off(constants.ws.games.GAMES_UPDATED_EVENT);
      socket.off(constants.ws.games.CODENAMES_SESSION_UPDATED_EVENT);
    };
  }, [queryClient, socket]);
};
