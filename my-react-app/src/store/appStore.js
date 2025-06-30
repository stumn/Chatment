import { create } from 'zustand';

// アプリケーションのUIやユーザー状態を管理するストア
const useAppStore = create((set) => ({

  // ログインしたユーザーの情報
  userInfo: {
    nickname: undefined,
    status: undefined,
    ageGroup: undefined
  },

  // ユーザー自身のパネルの高さ
  myHeight: 300,

  // アクション: ユーザー情報を設定する
  setUserInfo: ({ nickname, status, ageGroup }) => set((state) => ({
    userInfo: {
      nickname,
      status,
      ageGroup
    }
  })),

  // アクション: 高さを設定する
  setMyHeight: (height) => set({ myHeight: height }),

}));

export default useAppStore;