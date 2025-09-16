// コミュニケーションスペース関連のstore
// Zustandやその他のstate管理ライブラリを使用することを想定

import { create } from 'zustand'; // zustandを使用する場合

// スペースストアの型定義（TypeScriptを使用する場合）
/*
interface Space {
  id: string;
  name: string;
  description?: string;
  options: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive: boolean;
  participants?: User[];
  messages?: Message[];
}

interface SpaceState {
  // 現在選択されているスペース
  currentSpace: Space | null;
  // アクティブなスペース一覧
  activeSpaces: Space[];
  // 終了したスペース一覧
  finishedSpaces: Space[];
  // ローディング状態
  isLoading: boolean;
  // エラー状態
  error: string | null;
}
*/

export const useSpaceStore = create((set, get) => ({
  // 初期状態
  currentSpace: null,
  activeSpaces: [],
  finishedSpaces: [],
  isLoading: false,
  error: null,

  // アクション
  actions: {
    // 現在のスペースを設定
    setCurrentSpace: (space) => {
      set({ currentSpace: space });
      // TODO: ローカルストレージに保存
      // localStorage.setItem('currentSpace', JSON.stringify(space));
    },

    // スペース一覧を更新
    setActiveSpaces: (spaces) => {
      set({ activeSpaces: spaces });
    },

    // 終了したスペース一覧を更新
    setFinishedSpaces: (spaces) => {
      set({ finishedSpaces: spaces });
    },

    // 新しいスペースを追加
    addSpace: async (spaceData) => {
      set({ isLoading: true, error: null });
      
      try {
        // TODO: バックエンドAPIを呼び出して新しいスペースを作成
        // const response = await fetch('/api/spaces', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify(spaceData),
        // });
        
        // if (!response.ok) {
        //   throw new Error('スペースの作成に失敗しました');
        // }
        
        // const newSpace = await response.json();
        
        // 一時的なモック処理
        const newSpace = {
          ...spaceData,
          id: Date.now().toString(),
          createdAt: new Date(),
          isActive: true,
        };

        const { activeSpaces } = get();
        set({ 
          activeSpaces: [...activeSpaces, newSpace],
          isLoading: false 
        });

        return newSpace;
      } catch (error) {
        set({ 
          error: error.message || 'スペースの作成に失敗しました',
          isLoading: false 
        });
        throw error;
      }
    },

    // スペース一覧を取得
    fetchSpaces: async () => {
      set({ isLoading: true, error: null });
      
      try {
        // TODO: バックエンドAPIからスペース一覧を取得
        // const response = await fetch('/api/spaces');
        // if (!response.ok) {
        //   throw new Error('スペース一覧の取得に失敗しました');
        // }
        // const data = await response.json();
        
        // 一時的なモック処理
        const mockData = {
          activeSpaces: [
            { id: '1', name: 'Sample Space 1', description: 'Test space', options: '#test', isActive: true },
            { id: '2', name: 'Sample Space 2', description: 'Another test space', options: '#test2', isActive: true },
          ],
          finishedSpaces: [
            { id: '3', name: 'Finished Space', description: 'Completed space', options: '#finished', isActive: false },
          ]
        };

        set({ 
          activeSpaces: mockData.activeSpaces,
          finishedSpaces: mockData.finishedSpaces,
          isLoading: false 
        });

      } catch (error) {
        set({ 
          error: error.message || 'スペース一覧の取得に失敗しました',
          isLoading: false 
        });
      }
    },

    // スペースを終了状態にする
    finishSpace: async (spaceId) => {
      set({ isLoading: true, error: null });
      
      try {
        // TODO: バックエンドAPIでスペースを終了状態にする
        // const response = await fetch(`/api/spaces/${spaceId}/finish`, {
        //   method: 'PUT',
        // });

        const { activeSpaces, finishedSpaces } = get();
        const spaceToFinish = activeSpaces.find(space => space.id === spaceId);
        
        if (spaceToFinish) {
          const updatedSpace = { ...spaceToFinish, isActive: false };
          
          set({
            activeSpaces: activeSpaces.filter(space => space.id !== spaceId),
            finishedSpaces: [...finishedSpaces, updatedSpace],
            currentSpace: get().currentSpace?.id === spaceId ? null : get().currentSpace,
            isLoading: false
          });
        }

      } catch (error) {
        set({ 
          error: error.message || 'スペースの終了に失敗しました',
          isLoading: false 
        });
      }
    },

    // エラーをクリア
    clearError: () => {
      set({ error: null });
    },

    // ローカルストレージから状態を復元
    loadFromStorage: () => {
      try {
        const savedCurrentSpace = localStorage.getItem('currentSpace');
        if (savedCurrentSpace) {
          set({ currentSpace: JSON.parse(savedCurrentSpace) });
        }
      } catch (error) {
        console.error('ローカルストレージからの復元に失敗:', error);
      }
    },
  }
}));

// 使用方法の例:
/*
// コンポーネント内での使用
import { useSpaceStore } from '../store/spaceStore';

function MyComponent() {
  const currentSpace = useSpaceStore(state => state.currentSpace);
  const activeSpaces = useSpaceStore(state => state.activeSpaces);
  const { setCurrentSpace, addSpace, fetchSpaces } = useSpaceStore(state => state.actions);

  useEffect(() => {
    fetchSpaces(); // 初期データ取得
  }, []);

  const handleSelectSpace = (space) => {
    setCurrentSpace(space);
  };

  const handleAddNewSpace = async (spaceData) => {
    try {
      const newSpace = await addSpace(spaceData);
      console.log('新しいスペースが作成されました:', newSpace);
    } catch (error) {
      console.error('スペース作成エラー:', error);
    }
  };

  return (
    // JSX...
  );
}
*/
