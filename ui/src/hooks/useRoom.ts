import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { constants } from '@harrys-project/shared/constants';

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

    socket.on(constants.ws.CONNECT_EVENT, () => {
      console.log('Connected to WebSocket server');
    });

    socket.on(constants.ws.questions.QUESTIONS_EMIT_EVENT, (data) => {
      console.log('Received new question:', data);
      setLatestQuestion(
        data.question + Math.random().toString(36).substring(7),
      );
    });

    socket.emit(constants.ws.questions.QUESTIONS_ROOM, roomId);

    socket.on(constants.ws.questions.QUESTIONS_ROOM, (roomId) => {
      console.log(`Joined room: ${roomId}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, socket]);

  const postQuestion = (question: string) => {
    if (!socket) return;
    socket.emit(constants.ws.questions.QUESTIONS_EMIT_EVENT, {
      pollId: roomId,
      question,
    });
  };

  return { latestQuestion, postQuestion };
};
