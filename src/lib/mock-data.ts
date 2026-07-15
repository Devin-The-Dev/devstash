// No auth is wired up yet, so the dashboard is hardcoded to a single demo user.

export type User = {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
};

export const currentUser: User = {
  id: "user_1",
  name: "Alex Doe",
  email: "alex@example.com",
  isPro: false,
};
