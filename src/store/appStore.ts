import { create } from "zustand";

type AppStoreState = { isValidUser: boolean; theme: "dark" | "light" };

type AppStoreActions = {
  setIsValidUser: (value: AppStoreState["isValidUser"]) => void;
  setTheme: (value: AppStoreState["theme"]) => void;
};

type UserStore = AppStoreState & AppStoreActions;

export const appStore = create<UserStore>()((set) => ({
  isValidUser: true,
  theme: "light",
  setIsValidUser: (value) => {
    set(() => ({
      isValidUser: value,
    }));
  },
  setTheme: (value) => {
    set(() => ({
      theme: value,
    }));
  },
}));
