import usePostStore from '../../../store/spaces/postStore';
import useAppStore from '../../../store/spaces/appStore';

export const useBasicHandlers = (socket) => {
  const handleHeightChange = (data) => {
    // この関数はuseSocketのメイン部分で処理するため、ここでは空実装
    return data;
  };

  const handleConnectOK = (userInfo) => {
    socket.emit('fetch-history');
    socket.emit('fetch-docs');
  };

  const handleHistory = (data) => {
    // サーバーから送られたspaceIdと現在のspaceIdを比較
    const { messages, spaceId: receivedSpaceId } = data;
    const currentSpaceId = useAppStore.getState().userInfo?.spaceId;

    // 配列形式（後方互換性）の場合
    if (Array.isArray(data)) {
      usePostStore.getState().setPosts(data);
      return;
    }

    // currentSpaceIdがまだ未設定の場合、または一致する場合は更新
    if (currentSpaceId === undefined || !receivedSpaceId || receivedSpaceId === currentSpaceId) {
      usePostStore.getState().setPosts(messages || []);
    } else {
      console.warn(`履歴のspaceId不一致: 受信=${receivedSpaceId}, 現在=${currentSpaceId}`);
    }
  };

  const handleDocsHistory = (data) => {
    // サーバーから送られたspaceIdと現在のspaceIdを比較
    const { docs, spaceId: receivedSpaceId } = data;
    const currentSpaceId = useAppStore.getState().userInfo?.spaceId;

    // 配列形式（後方互換性）の場合
    if (Array.isArray(data)) {
      usePostStore.getState().setPosts(data);
      return;
    }

    // currentSpaceIdがまだ未設定の場合、または一致する場合は更新
    if (currentSpaceId === undefined || !receivedSpaceId || receivedSpaceId === currentSpaceId) {
      usePostStore.getState().setPosts(docs || []);
    } else {
      console.warn(`ドキュメントのspaceId不一致: 受信=${receivedSpaceId}, 現在=${currentSpaceId}`);
    }
  };

  const handleConnectError = (error) => {
    console.error('Socket connection error:', error);
  };

  const handleDisconnect = (reason) => {
    console.warn('Socket disconnected:', reason);
    // TODO: テロメア削除など
  };

  return {
    handleHeightChange,
    handleConnectOK,
    handleHistory,
    handleDocsHistory,
    handleConnectError,
    handleDisconnect
  };
};
