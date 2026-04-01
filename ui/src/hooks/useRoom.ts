import { constants } from '@harrys-project/shared/constants';
import {
  questionSchema,
  type QuestionsResponse,
} from '@harrys-project/shared/apiSchema';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

export const useRoom = (roomId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // const newSocket = io('http://localhost:3000');
    // // eslint-disable-next-line react-hooks/set-state-in-effect
    // setSocket(newSocket);
    // return () => {
    //   newSocket.disconnect();
    // };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // connect to websocket
    socket.on(constants.ws.CONNECT_EVENT, () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('clientAck', (data: string) => {
      if (data?.includes('Message posted!')) {
        console.log('Server acknowledged message posted!', data);
      } else {
        console.log(data);
      }
    });

    // connect to room
    socket.on(constants.ws.questions.QUESTIONS_ROOM, (message: string) => {
      console.log(message);
    });

    socket.on(
      constants.ws.questions.QUESTIONS_ROOM + '_leave',
      (message: string) => {
        console.log(message);
      },
    );

    // broadcast new question to room
    socket.on(constants.ws.questions.QUESTIONS_EMIT_EVENT, (wsData: any) => {
      console.log('Received new question:', wsData);

      const data = questionSchema.safeParse(wsData);

      if (data.success) {
        queryClient.setQueryData<QuestionsResponse | undefined>(
          [constants.rest.queryClientConfig.queryKeys.QUESTIONS_KEY],
          (oldData) => {
            return oldData
              ? {
                  ...oldData,
                  questions: [...oldData.questions, data.data],
                }
              : oldData;
          },
        );
      } else {
        console.log('Invalid question data received:', data.error);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, roomId, socket]);

  const postQuestion = () => {
    if (!socket) return;
    socket.emit(constants.ws.questions.QUESTIONS_EMIT_EVENT, {
      id: 'q3',
      userId: 'user_003',
      content: 'My new question',
      votes: 3,
      answered: false,
      createdAt: '2026-03-31T10:12:00Z',
    });
  };

  const joinRoom = () => {
    if (!socket) return;
    socket.emit(constants.ws.questions.QUESTIONS_ROOM, roomId);
  };

  const leaveRoom = () => {
    if (!socket) return;
    socket.emit(constants.ws.questions.QUESTIONS_ROOM + '_leave', roomId);
  };

  return { postQuestion, joinRoom, leaveRoom };
};
