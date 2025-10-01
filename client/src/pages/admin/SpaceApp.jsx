import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AddSpaceModal from '../../components/admin/AddSpaceModal';
import EditSpaceModal from '../../components/admin/EditSpaceModal';
import FinishedSpacesSection from '../../components/admin/FinishedSpacesSection';
import ActiveSpacesSection from '../../components/admin/ActiveSpacesSection';
import SpaceStatistics from '../../components/admin/SpaceStatistics';
import { LoadingMessage, SuccessMessage, ErrorMessage } from '../../components/shared/AlertMessage';
import useSpaceStore from '../../store/admin/spaceStore';

function SpaceApp() {
  // react-router-domのナビゲート機能
  const navigate = useNavigate();

  // Zustandストアから状態とアクションを取得
  const currentSpace = useSpaceStore(state => state.currentSpace);
  const activeSpaces = useSpaceStore(state => state.activeSpaces);
  const finishedSpaces = useSpaceStore(state => state.finishedSpaces);
  const isLoading = useSpaceStore(state => state.isLoading);
  const error = useSpaceStore(state => state.error);
  
  // アクション関数を取得
  const setCurrentSpace = useSpaceStore(state => state.setCurrentSpace);
  const fetchSpaces = useSpaceStore(state => state.fetchSpaces);
  const fetchAllSpaces = useSpaceStore(state => state.fetchAllSpaces);
  const addSpace = useSpaceStore(state => state.addSpace);
  const updateSpace = useSpaceStore(state => state.updateSpace);
  const finishSpace = useSpaceStore(state => state.finishSpace);
  const restoreCurrentSpaceFromStorage = useSpaceStore(state => state.restoreCurrentSpaceFromStorage);
  const clearError = useSpaceStore(state => state.clearError);

  // ローカル状態（モーダル表示のため）
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // 初期化時にデータを取得
  useEffect(() => {
    const initializeStore = async () => {
      try {
        // ローカルストレージから選択済みスペースを復元
        restoreCurrentSpaceFromStorage();
        
        // 管理者用全スペース一覧を取得
        await fetchAllSpaces();
      } catch (error) {
        console.error('初期化エラー:', error);
      }
    };

    initializeStore();
  }, [fetchAllSpaces, restoreCurrentSpaceFromStorage]);

  // コミュニケーションスペースを追加する関数
  const handleAddSpace = async (newSpace) => {
    try {
      await addSpace(newSpace);
      // モーダルを閉じる
      setIsAddModalOpen(false);
      setSuccessMessage('新しいスペースが作成されました');
      setTimeout(() => setSuccessMessage(''), 3000); // 3秒後に消去
    } catch (error) {
      console.error('スペース追加エラー:', error);
      // エラーが発生してもモーダルは閉じる（ユーザーが再試行できるよう）
    }
  };

  // コミュニケーションスペースを編集する関数
  const handleEditSpace = (space) => {
    setEditingSpace(space);
    setIsEditModalOpen(true);
  };

  // スペース更新処理
  const handleUpdateSpace = async (updatedSpace) => {
    try {
      await updateSpace(updatedSpace);
      // モーダルを閉じる
      setIsEditModalOpen(false);
      setEditingSpace(null);
      setSuccessMessage('スペースが更新されました');
      setTimeout(() => setSuccessMessage(''), 3000); // 3秒後に消去
      
      // スペース一覧を再取得
      await fetchAllSpaces();
    } catch (error) {
      console.error('スペース更新エラー:', error);
    }
  };

  // スペースを選択する関数
  const handleSelectSpace = (space) => {
    // Zustandストアを使用してスペースを選択
    setCurrentSpace(space);

    // 新しいタブでスペース詳細ページを開く（整数型スペースID対応）
    const spaceUrl = `/spaces/${space.id}`;
    window.open(spaceUrl, '_blank');

    // TODO: 選択されたスペースに関連するデータを取得
    // fetchSpaceMessages(space.id);
    // fetchSpaceParticipants(space.id);

    // TODO: リアルタイム通信の設定
    // socket.emit('join-space', space.id);
  };

  // スペースを終了する関数
  const handleFinishSpace = async (spaceId) => {
    try {
      await finishSpace(spaceId);
      setSuccessMessage('スペースが終了されました');
      setTimeout(() => setSuccessMessage(''), 3000); // 3秒後に消去
    } catch (error) {
      console.error('スペース終了エラー:', error);
    }
  };

  return (
    <div className="font-system bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto min-h-screen my-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">コミュニケーションスペース管理</h1>

        {/* 統計情報表示
        <SpaceStatistics 
          activeSpaces={activeSpaces}
          finishedSpaces={finishedSpaces}
        /> */}

        {/* メッセージ表示 */}
        <SuccessMessage 
          message={successMessage} 
          onClose={() => setSuccessMessage('')}
        />
        
        <ErrorMessage 
          message={error} 
          onClose={clearError}
        />
        
        <LoadingMessage 
          show={isLoading}
          message="読み込み中..."
        />

        <ActiveSpacesSection 
          activeSpaces={activeSpaces}
          selectedSpace={currentSpace}
          onSelectSpace={handleSelectSpace}
          onFinishSpace={handleFinishSpace}
          onEditSpace={handleEditSpace}
          onAddSpaceClick={() => setIsAddModalOpen(true)}
        />

        <FinishedSpacesSection finishedSpaces={finishedSpaces} />

        {/* フッター */}
        <div className="text-center text-gray-500 mt-8">
          <hr className="my-4 border-gray-200" />
          <p>© Mao NAKANO - Chatment </p>
        </div>

        {/* スペース追加モーダル */}
        <AddSpaceModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddSpace}
        />

        {/* スペース編集モーダル */}
        <EditSpaceModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingSpace(null);
          }}
          onUpdate={handleUpdateSpace}
          space={editingSpace}
        />
      </div>
  );
}

export default SpaceApp;
