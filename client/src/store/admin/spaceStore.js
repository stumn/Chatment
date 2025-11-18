import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * スペース管理用のZustand Store
 * 
 * 機能:
 * - アクティブなスペースの管理
 * - 終了したスペースの管理
 * - 現在選択されているスペースの状態管理
 * - スペースの追加・終了・更新操作
 * - APIとの連携
 */
const useSpaceStore = create(subscribeWithSelector((set, get) => ({
  // ===== 状態 =====

  /** @type {Array} アクティブなスペースの配列 */
  activeSpaces: [],

  /** @type {Array} 終了したスペースの配列 */
  finishedSpaces: [],

  /** @type {boolean} データ読み込み中かどうか */
  isLoading: false,

  /** @type {string|null} エラーメッセージ */
  error: null,

  // ===== アクション =====

  /**
   * ローディング状態を設定
   */
  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  /**
   * エラーメッセージを設定
   */
  setError: (error) => {
    set({ error });
  },

  /**
   * エラーをクリア
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * 管理者用: 全スペース一覧を取得
   */
  fetchAllSpaces: async () => {
    const { setLoading, setError, clearError } = get();

    setLoading(true);
    clearError();

    try {
      const response = await fetch('/api/admin/spaces');
      const data = await response.json();

      if (data.success) {
        const activeSpaces = data.spaces.filter(space => space.isActive && !space.isFinished);
        const finishedSpaces = data.spaces.filter(space => space.isFinished);

        set({
          activeSpaces,
          finishedSpaces,
          isLoading: false
        });

        return data.spaces;
      } else {
        throw new Error(data.error || '全スペース一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('全スペース一覧取得エラー:', error);
      setError(error.message);
      setLoading(false);
      throw error;
    }
  },

  /**
   * 新しいスペースを追加
   */
  addSpace: async (spaceData) => {
    const { setLoading, setError, clearError } = get();

    setLoading(true);
    clearError();

    try {
      // サブルーム設定のデフォルト値
      const defaultSubRoomSettings = {
        enabled: false,
        rooms: [{ name: '全体' }]
      };

      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: spaceData.id,
          name: spaceData.name,
          settings: {
            theme: 'default'
          },
          subRoomSettings: spaceData.subRoomSettings || defaultSubRoomSettings
        }),
      });

      const data = await response.json();

      if (data.success) {
        // ストアの状態を更新
        set((state) => ({
          activeSpaces: [...state.activeSpaces, data.space],
          isLoading: false
        }));

        return data.space;
      } else {
        throw new Error(data.error || 'スペースの作成に失敗しました');
      }
    } catch (error) {
      console.error('スペース追加エラー:', error);
      setError(error.message);
      setLoading(false);

      // エラー時のフォールバック: ローカルに追加
      set((state) => ({
        activeSpaces: [...state.activeSpaces, spaceData],
        isLoading: false
      }));

      throw error;
    }
  },

  /**
   * スペースを更新する
   */
  updateSpace: async (spaceData) => {
    const { setLoading, setError, clearError } = get();

    setLoading(true);
    clearError();

    try {
      const response = await fetch(`/api/spaces/${spaceData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: spaceData.name,
          subRoomSettings: spaceData.subRoomSettings
        }),
      });

      const data = await response.json();

      if (data.success) {
        // ストアの状態を更新 - IDの型を確認して正確に比較
        set((state) => ({
          activeSpaces: state.activeSpaces.map(space => {
            const spaceId = parseInt(space.id);
            const updateId = parseInt(spaceData.id);
            return spaceId === updateId ? { ...space, ...data.space } : space;
          }),
          finishedSpaces: state.finishedSpaces.map(space => {
            const spaceId = parseInt(space.id);
            const updateId = parseInt(spaceData.id);
            return spaceId === updateId ? { ...space, ...data.space } : space;
          }),
          isLoading: false
        }));

        return data.space;
      } else {
        throw new Error(data.error || 'スペースの更新に失敗しました');
      }
    } catch (error) {
      console.error('スペース更新エラー:', error);
      setError(error.message);
      setLoading(false);
      throw error;
    }
  },

  /**
   * スペースを終了する
   */
  finishSpace: async (spaceId) => {
    const { setLoading, setError, clearError } = get();

    setLoading(true);
    clearError();

    try {
      // バックエンドAPIでスペースを終了する処理
      const response = await fetch(`/api/spaces/${spaceId}/finish`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        const finishedSpace = data.space;

        set((state) => ({
          activeSpaces: state.activeSpaces.filter(space => space.id !== spaceId),
          finishedSpaces: [...state.finishedSpaces, finishedSpace],
          isLoading: false
        }));

        return finishedSpace;
      } else {
        throw new Error(data.error || 'スペースの終了に失敗しました');
      }
    } catch (error) {
      console.error('スペース終了エラー:', error);
      setError(error.message);
      setLoading(false);
      throw error;
    }
  },

  /**
   * ストアの状態をリセット
   */
  reset: () => {
    set({
      activeSpaces: [],
      finishedSpaces: [],
      isLoading: false,
      error: null
    });
  },

  /**
   * 統計情報を取得
   */
  getStatistics: () => {
    const { activeSpaces, finishedSpaces } = get();
    return {
      totalSpaces: activeSpaces.length + finishedSpaces.length,
      activeCount: activeSpaces.length,
      finishedCount: finishedSpaces.length
    };
  }
})));

export default useSpaceStore;
