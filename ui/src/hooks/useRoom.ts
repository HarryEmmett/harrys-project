import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { constants } from '@harrys-project/shared/constants';

export const useRoom = (roomId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [latestQuestion, setLatestQuestion] = useState<string | null>('');
  const [usersInRoom, setUsersInRoom] = useState<number>(0);

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
    socket.on(constants.ws.questions.QUESTIONS_ROOM, (message) => {
      console.log(message);
    });

    // broadcast number of users in room
    socket.on('users-in-room', (data) => {
      console.log(`Users in room users-room: ${data}`);
      setUsersInRoom(data);
    });

    // broadcast new question to room
    socket.on(constants.ws.questions.QUESTIONS_EMIT_EVENT, (data) => {
      console.log('Received new question:', data);
      setLatestQuestion(
        data.question + Math.random().toString(36).substring(7),
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, socket]);

  const postQuestion = (question: string) => {
    if (!socket) return;
    socket.emit(constants.ws.questions.QUESTIONS_EMIT_EVENT, {
      questionRoomId: roomId,
      question,
    });
  };

  const joinRoom = () => {
    if (!socket) return;
    socket.emit(constants.ws.questions.QUESTIONS_ROOM, roomId);
  };

  return { latestQuestion, postQuestion, usersInRoom, joinRoom };
};
