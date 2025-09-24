import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// TODO: スペースストアをインポート（Zustandなどのライブラリをインストール後）
// import { useSpaceStore } from '../../store/spaceStore';

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
  tdName: {
    padding: '16px 24px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    fontWeight: '500',
    color: '#111827',
    borderBottom: '1px solid #e5e7eb'
  },
  tdGray: {
    padding: '16px 24px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    color: '#6b7280',
    borderBottom: '1px solid #e5e7eb'
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none'
  },
  linkHover: {
    textDecoration: 'underline'
  },
  dropdown: {
    position: 'relative',
    display: 'inline-block',
    marginRight: '8px'
  },
  dropdownButton: {
    padding: '4px 12px',
    color: '#3b82f6',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px'
  },
  dropdownMenu: {
    position: 'absolute',
    left: 0,
    marginTop: '8px',
    padding: '4px 0',
    width: '128px',
    backgroundColor: 'white',
    borderRadius: '6px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    zIndex: 10
  },
  dropdownItem: {
    display: 'block',
    padding: '8px 16px',
    fontSize: '14px',
    color: '#374151',
    textDecoration: 'none'
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
  svg: {
    display: 'inline-block',
    marginLeft: '4px',
    width: '12px',
    height: '12px',
    color: '#6b7280'
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
  buttonSuccess: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginRight: '8px'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    width: '400px',
    maxWidth: '90%'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '12px',
    boxSizing: 'border-box'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '16px'
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  selectedSpace: {
    padding: '12px',
    backgroundColor: '#eff6ff',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
    marginBottom: '16px'
  }
};

const mockActiveRooms = [
  { id: 1, name: 'デフォルトスペース', options: '#main', description: 'メインのコミュニケーションスペース' },
  { id: 2, name: '2025.04.24 IT Design', options: '#it-design', description: 'ITデザインの議論スペース' },
  { id: 3, name: '2025.05.01 IT Design', options: '#it-design-may', description: 'ITデザインの議論スペース（5月版）' },
  { id: 4, name: '2025.05.15 IT Design', options: '#it-design-latest', description: 'ITデザインの議論スペース（最新版）' },
];

const mockFinishedRooms = [
  {
    id: 100,
    name: 'WISS練習用',
    options: '#wiss2016',
    description: 'WISS発表練習のためのスペース',
    files: {
      lines: ['json', 'csv'],
      users: ['json', 'csv'],
      actions: ['json', 'csv'],
    }
  },
  {
    id: 101,
    name: 'GROUP 2018 backchannel',
    options: '#group2018',
    description: '2018年のGROUP会議のバックチャンネル',
    files: {
      lines: ['json', 'csv'],
      users: ['json', 'csv'],
      actions: ['json', 'csv'],
    }
  },
  {
    id: 102,
    name: '2018.4.12 ITコミュニケーションデザインA',
    options: '#itcomm2018',
    description: 'ITコミュニケーションデザインの授業スペース',
    files: {
      lines: ['json', 'csv'],
      users: ['json', 'csv'],
      actions: ['json', 'csv'],
    }
  },
];

// コミュニケーションスペースを追加するためのモーダルコンポーネント
const AddSpaceModal = ({ isOpen, onClose, onAdd }) => {
  const [spaceName, setSpaceName] = useState('');
  const [spaceDescription, setSpaceDescription] = useState('');
  const [spaceOptions, setSpaceOptions] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (spaceName.trim()) {
      // TODO: バックエンドAPIへの送信
      // POST /api/spaces にスペース情報を送信する
      // const response = await fetch('/api/spaces', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name: spaceName, description: spaceDescription, options: spaceOptions })
      // });

      onAdd({
        id: Math.floor(Date.now() / 1000), // 整数型IDを生成（実際はサーバーから返されるIDを使用）
        name: spaceName,
        description: spaceDescription,
        options: spaceOptions || `#space-${Math.floor(Date.now() / 1000)}`
      });

      setSpaceName('');
      setSpaceDescription('');
      setSpaceOptions('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
          新しいコミュニケーションスペースを追加
        </h3>
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="text"
            placeholder="スペース名"
            value={spaceName}
            onChange={(e) => setSpaceName(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="text"
            placeholder="説明（任意）"
            value={spaceDescription}
            onChange={(e) => setSpaceDescription(e.target.value)}
          />
          <input
            style={styles.input}
            type="text"
            placeholder="オプション（例：#hashtag）"
            value={spaceOptions}
            onChange={(e) => setSpaceOptions(e.target.value)}
          />
          <div style={styles.buttonContainer}>
            <button
              type="button"
              style={styles.buttonSecondary}
              onClick={onClose}
            >
              キャンセル
            </button>
            <button
              type="submit"
              style={styles.button}
            >
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 終了した部屋の行をレンダリングするコンポーネント
const FinishedRoomRow = ({ room }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleDropdownToggle = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  const handleViewDocument = () => {
    // TODO: ドキュメント閲覧機能の実装
    // navigate(`/spaces/${room.id}/documents`);
    console.log(`ドキュメント閲覧: ${room.name}`);
  };

  return (
    <tr>
      <td style={styles.tdName}>
        <a
          href={`/log/${room.id}/`}
          style={styles.link}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          {room.name}
        </a>
      </td>
      <td style={styles.tdGray}>
        {Object.keys(room.files).map(fileType => (
          <span key={fileType} style={styles.dropdown}>
            <button
              style={styles.dropdownButton}
              type="button"
              onClick={() => handleDropdownToggle(fileType)}
              onMouseEnter={(e) => e.target.style.color = '#1d4ed8'}
              onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
            >
              {fileType}
              <svg style={styles.svg} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </button>
            <ul
              style={{
                ...styles.dropdownMenu,
                display: openDropdown === fileType ? 'block' : 'none'
              }}
            >
              {room.files[fileType].map(format => (
                <li key={format}>
                  <a
                    href={`/log/${room.id}/${fileType}.${format}`}
                    style={styles.dropdownItem}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {format}
                  </a>
                </li>
              ))}
            </ul>
          </span>
        ))}
      </td>
      <td style={styles.tdGray}>{room.options}</td>
      <td style={styles.td}>
        <button
          style={styles.button}
          onClick={handleViewDocument}
        >
          ドキュメント閲覧
        </button>
      </td>
    </tr>
  );
};

// テーブルヘッダーコンポーネント
const TableHeader = ({ columns }) => (
  <thead style={styles.tableHeader}>
    <tr>
      {columns.map(col => (
        <th key={col} scope="col" style={styles.th}>{col}</th>
      ))}
    </tr>
  </thead>
);

function SpaceApp() {
  // react-router-domのナビゲート機能
  const navigate = useNavigate();

  // TODO: Zustandストアを使用する場合（ライブラリインストール後）
  // const currentSpace = useSpaceStore(state => state.currentSpace);
  // const activeSpaces = useSpaceStore(state => state.activeSpaces);
  // const finishedSpaces = useSpaceStore(state => state.finishedSpaces);
  // const { setCurrentSpace, addSpace, fetchSpaces, finishSpace } = useSpaceStore(state => state.actions);

  // 現在は一時的にローカルステートを使用
  const [activeSpaces, setActiveSpaces] = useState(mockActiveRooms);
  const [finishedSpaces, setFinishedSpaces] = useState(mockFinishedRooms);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 初期化時にデータを取得
  useEffect(() => {
    const fetchSpacesFromAPI = async () => {
      try {
        const response = await fetch('/api/spaces');
        const data = await response.json();
        
        if (data.success) {
          // APIから取得したデータでモックデータを置き換え
          setActiveSpaces(data.spaces.filter(space => space.isActive));
          console.log('✅ スペース一覧を取得しました:', data.spaces.length);
        } else {
          console.error('スペース一覧の取得に失敗しました:', data.error);
        }
      } catch (error) {
        console.error('スペース一覧取得中にエラーが発生しました:', error);
        // エラー時はモックデータを使用
        console.log('📋 モックデータを使用します');
      }
    };

    fetchSpacesFromAPI();

    // ローカルストレージから選択済みスペースを復元
    const savedSpace = localStorage.getItem('selectedSpace');
    if (savedSpace) {
      try {
        const parsedSpace = JSON.parse(savedSpace);
        // 整数型IDに変換
        if (parsedSpace.id && typeof parsedSpace.id === 'string') {
          parsedSpace.id = parseInt(parsedSpace.id, 10);
        }
        setSelectedSpace(parsedSpace);
      } catch (error) {
        console.error('選択済みスペースの復元に失敗しました:', error);
      }
    }
  }, []);

  // コミュニケーションスペースを追加する関数
  const handleAddSpace = async (newSpace) => {
    try {
      // 実際のAPIを呼び出してスペースを作成
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: newSpace.id,
          name: newSpace.name,
          description: newSpace.description,
          createdByNickname: 'admin', // TODO: 実際のユーザー名を使用
          settings: {
            defaultRoomSettings: {
              autoDeleteMessages: false,
              messageRetentionDays: 30,
              allowAnonymous: true
            },
            maxRooms: 50,
            theme: 'default'
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        // APIから返された実際のスペースデータを使用
        setActiveSpaces(prev => [...prev, data.space]);
        console.log('✅ 新しいスペースが作成されました:', data.space);
      } else {
        throw new Error(data.error || 'スペースの作成に失敗しました');
      }
    } catch (error) {
      console.error('スペース追加エラー:', error);
      // エラー時はローカルに追加（フォールバック）
      setActiveSpaces(prev => [...prev, newSpace]);
    }
  };

  // スペースを選択する関数
  const handleSelectSpace = (space) => {
    // TODO: ストアのsetCurrentSpace関数を使用
    // setCurrentSpace(space);

    // 一時的な処理
    setSelectedSpace(space);
    localStorage.setItem('selectedSpace', JSON.stringify(space));

    // 新しいタブでスペース詳細ページを開く（整数型スペースID対応）
    const spaceUrl = `/spaces/${space.id}`;
    window.open(spaceUrl, '_blank');

    // TODO: 選択されたスペースに関連するデータを取得
    // fetchSpaceMessages(space.id);
    // fetchSpaceParticipants(space.id);

    // TODO: リアルタイム通信の設定
    // socket.emit('join-space', space.id);
  };

  // スペース選択をクリアする関数
  const handleClearSelection = () => {
    // TODO: ストアの状態をクリア
    // setCurrentSpace(null);

    // 一時的な処理
    setSelectedSpace(null);
    localStorage.removeItem('selectedSpace');

    // TODO: リアルタイム通信の切断
    // socket.emit('leave-space');
  };

  // スペースを終了する関数
  const handleFinishSpace = async (spaceId) => {
    try {
      // TODO: ストアのfinishSpace関数を使用
      // await finishSpace(spaceId);

      // 一時的な処理
      const spaceToFinish = activeSpaces.find(space => space.id === spaceId);
      if (spaceToFinish) {
        setActiveSpaces(prev => prev.filter(space => space.id !== spaceId));
        setFinishedSpaces(prev => [...prev, { ...spaceToFinish, isActive: false }]);

        if (selectedSpace?.id === spaceId) {
          handleClearSelection();
        }
      }

      // TODO: 成功通知を表示
      // showNotification('スペースが終了されました', 'success');
    } catch (error) {
      console.error('スペース終了エラー:', error);
      // TODO: エラー通知を表示
      // showNotification('スペースの終了に失敗しました', 'error');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>コミュニケーションスペース管理</h1>

        <div style={styles.section}>
          <div style={styles.actionBar}>
            <h2 style={styles.sectionTitle}>アクティブなコミュニケーションスペース</h2>
            <button
              style={styles.button}
              onClick={() => setIsAddModalOpen(true)}
            >
              ＋ 新しいスペースを追加
            </button>
          </div>
          <table style={styles.table}>
            <TableHeader columns={['スペース名', '説明', 'オプション', 'アクション']} />
            <tbody>
              {activeSpaces.map(space => (
                <tr key={space.id}>
                  <td style={styles.tdName}>
                    <a
                      href={`/spaces/${space.id}`}
                      style={styles.link}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                      {space.name}
                    </a>
                  </td>
                  <td style={styles.tdGray}>{space.description || '説明なし'}</td>
                  <td style={styles.tdGray}>{space.options}</td>
                  <td style={styles.td}>
                    <button
                      style={styles.buttonSuccess}
                      onClick={() => handleSelectSpace(space)}
                      disabled={selectedSpace?.id === space.id}
                    >
                      入場
                    </button>
                    <button
                      style={{ ...styles.buttonSecondary, backgroundColor: '#ef4444' }}
                      onClick={() => handleFinishSpace(space.id)}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                    >
                      終了
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>終了したコミュニケーションスペース</h2>
          <table style={styles.table}>
            <TableHeader columns={['スペース名', 'ファイル', 'オプション', 'アクション']} />
            <tbody>
              {finishedSpaces.map(space => (
                <FinishedRoomRow key={space.id} room={space} />
              ))}
            </tbody>
          </table>
        </div>
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
