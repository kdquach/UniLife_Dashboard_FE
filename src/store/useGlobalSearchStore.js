import { create } from "zustand";

// Store dùng cho ô tìm kiếm global trên header
export const useGlobalSearchStore = create((set) => ({
    keyword: "",
    setKeyword: (value) => set({ keyword: value }),
    clearKeyword: () => set({ keyword: "" }),
}));
