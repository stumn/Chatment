import { create } from 'zustand';

// アプリケーションのUIやユーザー状態を管理するストア
const useAppStore = create((set) => ({
  // ログインしているユーザー名 (isNameから改名)
  userName: undefined,
  // ユーザー自身のパネルの高さ
  myHeight: 300,

  // アクション: ユーザー名を設定する
  setUserName: (name) => set({ userName: name }),
  // アクション: 高さを設定する
  setMyHeight: (height) => set({ myHeight: height }),
}));

export default useAppStore;