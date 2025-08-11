import usePostStore from '../../../store/postStore';

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
    console.log('History received:', historyArray.length, 'posts');
  };

  const handleDocsHistory = (docs) => {
    // docsはdisplayOrder順でソートされている前提
    usePostStore.getState().setPosts(docs);
    console.log('Docs history received:', docs.length, 'posts');
  };

  const handleConnectError = (error) => {
    console.error('Socket connection error:', error);
    // TODO: ユーザーにエラーメッセージを表示する仕組みを追加
  };

  const handleDisconnect = (reason) => {
    console.warn('Socket disconnected:', reason);
    // TODO: 再接続の試行やユーザー通知の仕組みを追加
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
