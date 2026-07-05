import { constants } from '@harrys-project/shared/constants';
import {
  questionSchema,
  chatQuestionSchema,
} from '@harrys-project/shared/apiSchema';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import {
  addQuestionToCache,
  removeQuestionFromCache,
  updateQuestionInCache,
} from '../api/questionsCache';
import {
  addChatQuestionToCache,
  updateChatQuestionInCache,
} from '../api/chatQuestionsCache';

export const useRoom = (roomId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const newSocket = io('http://localhost:3000/questions');
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
      const data = questionSchema.safeParse(wsData);

      if (data.success) {
        addQuestionToCache(queryClient, data.data);
      } else {
        console.log('Invalid question data received:', data.error);
      }
    });

    socket.on(constants.ws.questions.QUESTIONS_UPDATED_EVENT, (wsData: any) => {
      const data = questionSchema.safeParse(wsData);

      if (data.success) {
        updateQuestionInCache(queryClient, data.data);
      } else {
        console.log('Invalid question data received:', data.error);
      }
    });

    socket.on(constants.ws.questions.QUESTIONS_DELETED_EVENT, (id: string) => {
      removeQuestionFromCache(queryClient, id);
    });

    // Chat-question broadcasts are scoped to a room named after the question
    // id (see questions.gateway.ts), so these only ever fire for a useRoom()
    // instance whose roomId is that question's id (i.e. one that actually
    // joined it via joinRoom()).
    socket.on(
      constants.ws.questions.CHAT_QUESTION_ADDED_EVENT,
      (wsData: any) => {
        const data = chatQuestionSchema.safeParse(wsData);

        if (data.success) {
          addChatQuestionToCache(queryClient, roomId, data.data);
        } else {
          console.log('Invalid chat question data received:', data.error);
        }
      },
    );

    socket.on(
      constants.ws.questions.CHAT_QUESTION_UPDATED_EVENT,
      (wsData: any) => {
        const data = chatQuestionSchema.safeParse(wsData);

        if (data.success) {
          updateChatQuestionInCache(queryClient, roomId, data.data);
        } else {
          console.log('Invalid chat question data received:', data.error);
        }
      },
    );

    return () => {
      socket.off(constants.ws.CONNECT_EVENT);
      socket.off('clientAck');
      socket.off(constants.ws.questions.QUESTIONS_ROOM);
      socket.off(constants.ws.questions.QUESTIONS_ROOM + '_leave');
      socket.off(constants.ws.questions.QUESTIONS_EMIT_EVENT);
      socket.off(constants.ws.questions.QUESTIONS_UPDATED_EVENT);
      socket.off(constants.ws.questions.QUESTIONS_DELETED_EVENT);
      socket.off(constants.ws.questions.CHAT_QUESTION_ADDED_EVENT);
      socket.off(constants.ws.questions.CHAT_QUESTION_UPDATED_EVENT);
    };
  }, [queryClient, roomId, socket]);

  // Joins/leaves the room whenever BOTH the socket is connected AND roomId is
  // set — not just on mount. Calling this from the caller's own effect keyed
  // only on roomId is a race: roomId is often already truthy on first render
  // (e.g. a route param), while the socket itself connects asynchronously a
  // moment later, so the join would silently no-op and never get retried.
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit(constants.ws.questions.QUESTIONS_ROOM, roomId);

    return () => {
      socket.emit(constants.ws.questions.QUESTIONS_ROOM + '_leave', roomId);
    };
  }, [socket, roomId]);

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

  return { postQuestion };
};
