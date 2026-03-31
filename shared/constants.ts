export const constants = {
  rest: {
    QUESTIONS_ENDPOINT: "/questions",
    PAGE_VISITS_ENDPOINT: "/page-visits",
    LIKES_ENDPOINT: "/likes",
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
