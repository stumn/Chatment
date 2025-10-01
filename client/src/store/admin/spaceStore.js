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
  
  /** @type {Object|null} 現在選択されているスペース */
  currentSpace: null,
  
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
   * 現在のスペースを設定
   */
  setCurrentSpace: (space) => {
    set({ currentSpace: space });
    
    // ローカルストレージに保存
    if (space) {
      localStorage.setItem('selectedSpace', JSON.stringify(space));
    } else {
      localStorage.removeItem('selectedSpace');
    }
  },

  /**
   * APIからスペース一覧を取得
   */
  fetchSpaces: async () => {
    const { setLoading, setError, clearError } = get();
    
    setLoading(true);
    clearError();
    
    try {
      const response = await fetch('/api/spaces');
      const data = await response.json();
      
      if (data.success) {
        const activeSpaces = data.spaces.filter(space => space.isActive && !space.isFinished);
        const finishedSpaces = data.spaces.filter(space => space.isFinished);
        
        set({
          activeSpaces,
          finishedSpaces,
          isLoading: false
        });
        
        console.log('✅ スペース一覧を取得しました:', data.spaces.length);
        return data.spaces;
      } else {
        throw new Error(data.error || 'スペース一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('スペース一覧取得エラー:', error);
      setError(error.message);
      setLoading(false);
      throw error;
    }
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
        
        console.log('✅ 管理者用全スペース一覧を取得しました:', data.spaces.length);
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
        rooms: [{ name: '全体', description: '全ての投稿を表示' }],
        maxRooms: 10
      };

      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: spaceData.id,
          name: spaceData.name,
          description: spaceData.description,
          settings: {
            defaultRoomSettings: {
              autoDeleteMessages: false,
              messageRetentionDays: 30,
              allowAnonymous: true
            },
            maxRooms: 50,
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
        
        console.log('✅ 新しいスペースが作成されました:', data.space);
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
          description: spaceData.description,
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
        
        console.log('✅ スペースが更新されました:', data.space);
        console.log('🔄 ストア更新完了 - activeSpaces count:', get().activeSpaces.length);
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
    const { setLoading, setError, clearError, currentSpace, setCurrentSpace } = get();
    
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

        // 現在選択されているスペースが終了された場合はクリア
        if (currentSpace?.id === spaceId) {
          setCurrentSpace(null);
        }

        console.log('✅ スペースが終了されました:', finishedSpace.name);
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
   * ローカルストレージから選択済みスペースを復元
   */
  restoreCurrentSpaceFromStorage: () => {
    try {
      const savedSpace = localStorage.getItem('selectedSpace');
      if (savedSpace) {
        const parsedSpace = JSON.parse(savedSpace);
        
        // 整数型IDに変換
        if (parsedSpace.id && typeof parsedSpace.id === 'string') {
          parsedSpace.id = parseInt(parsedSpace.id, 10);
        }
        
        set({ currentSpace: parsedSpace });
        console.log('📦 選択済みスペースを復元しました:', parsedSpace.name);
        return parsedSpace;
      }
    } catch (error) {
      console.error('選択済みスペースの復元に失敗しました:', error);
      return null;
    }
  },

  /**
   * ストアの状態をリセット
   */
  reset: () => {
    set({
      activeSpaces: [],
      finishedSpaces: [],
      currentSpace: null,
      isLoading: false,
      error: null
    });
    localStorage.removeItem('selectedSpace');
  },

  /**
   * 統計情報を取得
   */
  getStatistics: () => {
    const { activeSpaces, finishedSpaces } = get();
    return {
      totalSpaces: activeSpaces.length + finishedSpaces.length,
      activeCount: activeSpaces.length,
      finishedCount: finishedSpaces.length,
      hasCurrentSpace: !!get().currentSpace
    };
  }
})));

export default useSpaceStore;
