import { constants } from '@harrys-project/shared/constants';
import { questionSchema } from '@harrys-project/shared/apiSchema';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useRoom = (roomId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [latestQuestion, setLatestQuestion] = useState<string | null>('');

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // connect to websocket
    socket.on(constants.ws.CONNECT_EVENT, () => {
      console.log('Connected to WebSocket server');
    });

    // connect to room
    socket.on(constants.ws.questions.QUESTIONS_ROOM, (message: string) => {
      console.log(message);
    });

    // broadcast new question to room
    socket.on(constants.ws.questions.QUESTIONS_EMIT_EVENT, (wsData: any) => {
      console.log('Received new question:', wsData);

      const data = questionSchema.safeParse(wsData);

      if (data.success) {
        setLatestQuestion(data.data.content);
      } else {
        console.log('Invalid question data received:', data.error);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, socket]);

  const postQuestion = () => {
    if (!socket) return;
    socket.emit(constants.ws.questions.QUESTIONS_EMIT_EVENT, {
      event: {
        id: 'event_001',
        title: 'Town Hall Q&A',
        description: 'Mock Slido clone event for testing UI',
        createdAt: '2026-03-31T10:00:00Z',
      },
      participants: [
        { id: 'user_001', name: 'Alice' },
        { id: 'user_002', name: 'Bob' },
        { id: 'user_003', name: 'Charlie' },
      ],
      questions: [
        {
          id: 'q1',
          userId: 'user_001',
          content: 'Can we get an update on the roadmap?',
          votes: 5,
          answered: false,
          createdAt: '2026-03-31T10:05:00Z',
        },
        {
          id: 'q2',
          userId: 'user_002',
          content: 'Will there be a mobile app?',
          votes: 8,
          answered: true,
          createdAt: '2026-03-31T10:07:00Z',
        },
        {
          id: 'q3',
          userId: 'user_003',
          content: 'Can we have more frequent team meetings?',
          votes: 3,
          answered: false,
          createdAt: '2026-03-31T10:12:00Z',
        },
      ],
    });
  };

  const joinRoom = () => {
    if (!socket) return;
    socket.emit(constants.ws.questions.QUESTIONS_ROOM, roomId);
  };

  return { latestQuestion, postQuestion, joinRoom };
};
