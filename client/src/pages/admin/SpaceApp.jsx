import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AddSpaceModal from '../../components/AddSpaceModal';
import FinishedSpacesSection from '../../components/FinishedSpacesSection';
import ActiveSpacesSection from '../../components/ActiveSpacesSection';
import SpaceStatistics from '../../components/SpaceStatistics';
import useSpaceStore from '../../store/spaceStore';

const styles = {
  container: {
    padding: '32px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  card: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '1024px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '16px',
    textAlign: 'left'
  },
  section: {
    marginBottom: '32px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    borderBottom: '1px solid #e5e7eb'
  },
  tableHeader: {
    backgroundColor: '#f9fafb'
  },
  th: {
    padding: '12px 24px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e5e7eb'
  },
  td: {
    padding: '16px 24px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    borderBottom: '1px solid #e5e7eb'
  },


  footer: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: '32px'
  },
  hr: {
    margin: '16px 0',
    border: 'none',
    borderTop: '1px solid #e5e7eb'
  },
  // 新しいスタイル追加
  button: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginRight: '8px'
  },
  buttonSecondary: {
    padding: '8px 16px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginRight: '8px'
  },

  selectedSpace: {
    padding: '12px',
    backgroundColor: '#eff6ff',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
    marginBottom: '16px'
  }
};



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
  const finishSpace = useSpaceStore(state => state.finishSpace);
  const restoreCurrentSpaceFromStorage = useSpaceStore(state => state.restoreCurrentSpaceFromStorage);
  const clearError = useSpaceStore(state => state.clearError);

  // ローカル状態（モーダル表示のため）
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>コミュニケーションスペース管理</h1>

        {/* 統計情報表示 */}
        <SpaceStatistics 
          activeSpaces={activeSpaces}
          finishedSpaces={finishedSpaces}
        />

        {/* 成功メッセージ表示 */}
        {successMessage && (
          <div style={{
            padding: '12px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '4px',
            color: '#059669',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#059669',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* エラーメッセージ表示 */}
        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            color: '#dc2626',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{error}</span>
            <button
              onClick={clearError}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* ローディング状態表示 */}
        {isLoading && (
          <div style={{
            padding: '12px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '4px',
            color: '#0369a1',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            読み込み中...
          </div>
        )}

        <ActiveSpacesSection 
          activeSpaces={activeSpaces}
          selectedSpace={currentSpace}
          onSelectSpace={handleSelectSpace}
          onFinishSpace={handleFinishSpace}
          onAddSpaceClick={() => setIsAddModalOpen(true)}
        />

        <FinishedSpacesSection finishedSpaces={finishedSpaces} />
      </div>

      <div style={styles.footer}>
        <hr style={styles.hr} />
        <p>© Mao NAKANO - Chatment </p>
      </div>

      {/* スペース追加モーダル */}
      <AddSpaceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddSpace}
      />
    </div>
  );
}

export default SpaceApp;
