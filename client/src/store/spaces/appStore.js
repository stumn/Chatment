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

  // コンパクトモード（true: ホバー時のみボタン表示、false: 常時表示）
  isCompactMode: false,

  // チャットスクロールモード（true: 通常モードでもすべてのメッセージをスクロール表示、false: 制限された行数のみ表示）
  isChatScrollMode: false,

  // 目次の開閉状態
  isTocOpen: true,

  // フィルター設定
  selectedHeadingId: null, // 選択された見出しのID（nullの場合は全て表示）
  indentFilter: null, // インデントフィルター（nullの場合はフィルターなし、数値の場合はそのインデントレベル以下を表示）
  minLikesFilter: null, // 最小いいね数フィルター（nullの場合はフィルターなし）

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

  // アクション: コンパクトモードを切り替える
  toggleCompactMode: () => set((state) => ({ isCompactMode: !state.isCompactMode })),

  // アクション: チャットスクロールモードを切り替える
  toggleChatScrollMode: () => set((state) => ({ isChatScrollMode: !state.isChatScrollMode })),

  // アクション: 目次の開閉を切り替える
  toggleToc: () => set((state) => ({ isTocOpen: !state.isTocOpen })),

  // アクション: 見出しフィルターを設定する
  setHeadingFilter: (headingId) => set({ selectedHeadingId: headingId }),

  // アクション: インデントフィルターを設定する
  setIndentFilter: (indent) => set({ indentFilter: indent }),

  // アクション: 最小いいね数フィルターを設定する
  setMinLikesFilter: (minLikes) => set({ minLikesFilter: minLikes }),

}));

export default useAppStore;