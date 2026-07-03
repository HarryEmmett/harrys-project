export const constants = {
  rest: {
    endpoints: {
      QUESTIONS_ENDPOINT: "/questions",
      PAGE_VISITS_ENDPOINT: "/page-visits",
      LIKES_ENDPOINT: "/likes",
      FRIENDS_ENDPOINT: "/friends",
      MESSAGES_ENDPOINT: "/messages",
    },
    queryClientConfig: {
      queryKeys: {
        QUESTIONS_KEY: "questionsKey",
        QUESTION_KEY: "questionKey",
        QUESTION_CHAT_KEY: "questionChatKey",
        PAGE_VISITS_KEY: "pageVisitsKey",
        LIKES_KEY: "likesKey",
        FRIENDS_KEY: "friendsKey",
        MESSAGES_KEY: "messagesKey",
      },
      config: {
        STALE_TIME: 5 * 60 * 1000,
      },
    },
  },
  ws: {
    questions: {
      QUESTIONS_TOPIC: "questions-topic",
      QUESTIONS_EMIT_EVENT: "questions-added",
      QUESTIONS_ROOM: "question-room",
    },
    likes: {
      LIKES_EMIT_EVENT: "likes-added",
    },
    CONNECT_EVENT: "connect",
  },
} as const;
