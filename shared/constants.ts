export const constants = {
  rest: {
    endpoints: {
      GAMES_ENDPOINT: "/games",
    },
    queryClientConfig: {
      queryKeys: {
        GAMES_KEY: "gamesKey",
        GAME_KEY: "gameKey",
        GAME_QUESTIONS_KEY: "gameQuestionsKey",
        FRIENDS_KEY: "friendsKey",
        MESSAGES_KEY: "messagesKey",
      },
      config: {
        STALE_TIME: 5 * 60 * 1000,
      },
    },
  },
  ws: {
    games: {
      GAMES_UPDATED_EVENT: "games-updated",
    },
    presence: {
      ONLINE_COUNT_EVENT: "onlineCount:update",
    },
    CONNECT_EVENT: "connect",
  },
} as const;
