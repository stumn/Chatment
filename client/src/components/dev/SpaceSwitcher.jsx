// テスト用: スペース切り替えコンポーネント
import React, { useState } from 'react';
import useAppStore from '../../store/spaces/appStore';
import useRoomStore from '../../store/spaces/roomStore';
import useSocket from '../../hooks/shared/useSocket';

const SpaceSwitcher = () => {
  const { userInfo, setUserInfo } = useAppStore();
  const { emitGetRoomList } = useSocket();
  const { setRooms, setCurrentSpaceInfo } = useRoomStore();
  const [switching, setSwitching] = useState(false);

  const switchToSpace = async (spaceId, spaceName) => {
    setSwitching(true);
    console.log(`🔄 [SpaceSwitcher] スペース ${spaceId} (${spaceName}) に切り替え中...`);

    // userInfo を更新
    setUserInfo({
      ...userInfo,
      spaceId: spaceId
    });

    // ルーム一覧をクリア
    setRooms([]);
    setCurrentSpaceInfo(null);

    // 少し待ってからルーム一覧を取得
    setTimeout(() => {
      emitGetRoomList();
      setSwitching(false);
    }, 500);
  };

  const spaces = [
    { id: 0, name: 'デフォルトスペース', subRoom: '有効' },
    { id: 999, name: 'テストスペース', subRoom: '有効' },
    { id: 1759240594, name: 'aaa', subRoom: '無効' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#fff',
      border: '2px solid #ccc',
      borderRadius: '8px',
      padding: '10px',
      zIndex: 9999,
      minWidth: '250px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
        🧪 テスト用スペース切り替え
      </h4>
      <div style={{ fontSize: '12px', marginBottom: '8px', color: '#666' }}>
        現在: スペース {userInfo?.spaceId} 
      </div>
      {spaces.map(space => (
        <button
          key={space.id}
          onClick={() => switchToSpace(space.id, space.name)}
          disabled={switching || userInfo?.spaceId === space.id}
          style={{
            display: 'block',
            width: '100%',
            margin: '2px 0',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: userInfo?.spaceId === space.id ? '#e3f2fd' : '#fff',
            cursor: switching || userInfo?.spaceId === space.id ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          {switching ? '切り替え中...' : `${space.name} (サブルーム${space.subRoom})`}
        </button>
      ))}
    </div>
  );
};

export default SpaceSwitcher;