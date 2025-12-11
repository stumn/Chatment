import usePostStore from '../../../store/spaces/postStore';

export const useBasicHandlers = (socket) => {
  const handleHeightChange = (data) => {
    // この関数はuseSocketのメイン部分で処理するため、ここでは空実装
    return data;
  };

  const handleConnectOK = (userInfo) => {
    socket.emit('fetch-history');
    socket.emit('fetch-docs');
  };

  const handleHistory = (historyArray) => {
    usePostStore.getState().setPosts(historyArray);
  };

  const handleDocsHistory = (docs) => {
    // docsはdisplayOrder順でソートされている前提
    usePostStore.getState().setPosts(docs);
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
