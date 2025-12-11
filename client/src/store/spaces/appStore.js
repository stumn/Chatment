import { create } from 'zustand';

// アプリケーションのUIやユーザー状態を管理するストア
const useAppStore = create((set) => ({

  // ログインしたユーザーの情報
  userInfo: {
    nickname: undefined,
    status: undefined,
    ageGroup: undefined,
    spaceId: undefined, // spaceIdも保持
  },

  // スペース名
  spaceName: undefined,

  // ユーザー自身のパネルの高さ
  myHeight: 300,

  // カラフルモード（true: カラフル、false: シンプル）
  isColorfulMode: true,

  // 目次の開閉状態
  isTocOpen: true,

  // アクション: ユーザー情報を設定する
  setUserInfo: ({ nickname, status, ageGroup, userId, spaceId }) => set({
    userInfo: { nickname, status, ageGroup, userId, spaceId }
  }),

  // アクション: スペース名を設定する
  setSpaceName: (name) => set({ spaceName: name }),

  // アクション: 高さを設定する
  setMyHeight: (height) => set({ myHeight: height }),

  // アクション: カラフルモードを切り替える
  toggleColorfulMode: () => set((state) => ({ isColorfulMode: !state.isColorfulMode })),

  // アクション: 目次の開閉を切り替える
  toggleToc: () => set((state) => ({ isTocOpen: !state.isTocOpen })),

}));

export default useAppStore;