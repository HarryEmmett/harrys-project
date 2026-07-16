export const constants = {
  rest: {
    endpoints: {
      GAMES_ENDPOINT: "/games",
      FORUM_POSTS_ENDPOINT: "/forum-posts",
    },
    queryClientConfig: {
      queryKeys: {
        GAMES_KEY: "gamesKey",
        GAME_KEY: "gameKey",
        GAME_QUESTIONS_KEY: "gameQuestionsKey",
        FORUM_POSTS_KEY: "forumPostsKey",
        FORUM_POST_KEY: "forumPostKey",
        FORUM_POST_REPLIES_KEY: "forumPostRepliesKey",
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
