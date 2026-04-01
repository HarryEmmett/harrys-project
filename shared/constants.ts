export const constants = {
  rest: {
    endpoints: {
      QUESTIONS_ENDPOINT: "/questions",
      PAGE_VISITS_ENDPOINT: "/page-visits",
      LIKES_ENDPOINT: "/likes",
    },
    queryClientConfig: {
      queryKeys: {
        QUESTIONS_KEY: "questionsKey",
        PAGE_VISITS_KEY: "pageVisitsKey",
        LIKES_KEY: "likesKey",
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
    CONNECT_EVENT: "connect",
  },
} as const;
