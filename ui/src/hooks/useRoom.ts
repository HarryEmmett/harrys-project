import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useRoom = (roomId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [latestQuestion, setLatestQuestion] = useState<string | null>("");

  useEffect(() => {
    const newSocket = io("http://localhost:3000");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("question-added", (data) => {
      console.log("Received new question:", data);
      setLatestQuestion(
        data.question + Math.random().toString(36).substring(7),
      );
    });

    socket.emit("question-room", roomId);

    socket.on("question-room", (roomId) => {
      console.log(`Joined room: ${roomId}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, socket]);

  const postQuestion = (question: string) => {
    if (!socket) return;
    socket.emit("question-added", { pollId: roomId, question });
  };

  return { latestQuestion, postQuestion };
};
