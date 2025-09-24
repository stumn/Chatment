// SpaceDetail.jsx - 整数型スペースIDを使用したスペース詳細画面
import { useParams } from 'react-router-dom';
import { useEffect, useState, Suspense, lazy } from 'react';
import { useAppController } from '../../hooks/useAppController';
import useAppStore from '../../store/appStore';
import useSizeStore from '../../store/sizeStore';
import useSocket from '../../hooks/useSocket';
import useResponsiveSize from '../../utils/useResponsiveSize';
import BeforeLogin from "./BeforeLogin";

const AfterLogin = lazy(() => import('./AfterLogin'));

function SpaceDetail() {
  // URLパスパラメータを取得し、整数に変換
  const { spaceId } = useParams();
  const currentSpaceId = parseInt(spaceId, 10); // 整数型に変換

  // --- 状態管理フックを先に記述 ---
  const [open, setOpen] = useState(true);
  const [spaceData, setSpaceData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- カスタムフック ---
  useResponsiveSize();

  // ストアからの状態取得
  const { width, height } = useSizeStore();
  const { userInfo, setUserInfo, myHeight, setMyHeight } = useAppStore();

  // useAppControllerを使用してSocket通信を一元管理
  const appController = useAppController();
  const { socket: { heightArray }, raw: socketFunctions } = appController;

  // ルーム関連のソケット関数を取得
  const { emitGetRoomList, emitJoinRoom } = useSocket();

  // ログイン状態を判定する変数を定義
  const isLoggedIn = userInfo.nickname !== undefined;

  // スペース情報を取得
  useEffect(() => {
    const fetchSpaceData = async () => {
      if (!currentSpaceId || isNaN(currentSpaceId)) {
        console.error('無効なスペースID:', spaceId);
        return;
      }

      try {
        const response = await fetch(`/api/spaces/${currentSpaceId}`);
        const data = await response.json();
        
        if (data.success) {
          setSpaceData(data.space);
        } else {
          console.error('スペースデータ取得エラー:', data.error);
        }
      } catch (error) {
        console.error('スペース情報取得中にエラーが発生しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpaceData();
  }, [currentSpaceId, spaceId]);

  // ログイン後の処理
  useEffect(() => {
    if (!isLoggedIn || !currentSpaceId) return;
    
    socketFunctions.emitLoginName(userInfo);

    // ログイン後にスペース別ルーム一覧を取得し、デフォルトルームに参加
    emitGetRoomList();
    emitJoinRoom(`room-0`); // スペース内のデフォルトルーム

    setOpen(false);
  }, [userInfo, isLoggedIn, currentSpaceId]);

  // myHeightが変更されたらサーバーに高さを送信
  useEffect(() => {
    socketFunctions.emitHeightChange(myHeight);
  }, [myHeight]);

  // スペースIDが無効な場合
  if (!currentSpaceId || isNaN(currentSpaceId)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <h2>無効なスペースIDです</h2>
        <p>スペースID: {spaceId}</p>
        <button onClick={() => window.location.href = '/admin'}>
          スペース一覧に戻る
        </button>
      </div>
    );
  }

  // ローディング状態
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>スペース情報を読み込み中...</div>
      </div>
    );
  }

  // スペースが存在しない場合
  if (!spaceData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <h2>スペースが見つかりません</h2>
        <p>スペースID: {currentSpaceId}</p>
        <button onClick={() => window.location.href = '/admin'}>
          スペース一覧に戻る
        </button>
      </div>
    );
  }

  if (isLoggedIn) { // ログイン完了後
    return (
      <div>
        {/* スペース情報ヘッダー */}
        <div style={{
          padding: '10px 20px',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0 }}>
              {spaceData.name} (ID: {currentSpaceId})
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              {spaceData.description}
            </p>
          </div>
          <button onClick={() => window.location.href = '/admin'}>
            スペース一覧
          </button>
        </div>
        
        {/* チャット機能（AfterLoginコンポーネントを再利用） */}
        <Suspense fallback={<div>Loading...</div>}>
          <AfterLogin
            heightArray={heightArray}
            appController={appController}
            userInfo={userInfo}
            spaceId={currentSpaceId} // スペースIDを渡す
          />
        </Suspense>
      </div>
    );
  } else { // ログイン前
    return (
      <div>
        {/* スペース情報ヘッダー */}
        <div style={{
          padding: '10px 20px',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd'
        }}>
          <h3 style={{ margin: 0 }}>
            {spaceData.name} (ID: {currentSpaceId})
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            {spaceData.description}
          </p>
        </div>
        
        <Suspense fallback={<div>Loading...</div>}>
          <BeforeLogin open={open} onLogin={setUserInfo} />
        </Suspense>
      </div>
    );
  }
}

export default SpaceDetail;