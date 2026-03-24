// イベントハンドラーのマッピング
export const createEventHandlerMap = (handlers) => {
  const {
    // Basic handlers
    handleHeightChange,
    handleConnectOK,
    handleHistory,
    handleDocsHistory,
    handleConnectError,
    handleDisconnect,

    // Chat handlers
    handleChatMessage,
    handlePositive,
    handleNegative,

    // Doc handlers
    handleDocAdd,
    handleDocEdit,
    handleDocReorder,
    handleDocDelete,
    handleDocError,
    handleIndentChange,

    // Lock handlers
    handleLockPermitted,
    handleRowLocked,
    handleRowUnlocked,
    handleLockNotAllowed,

    // Room handlers
    handleRoomJoined,
    handleRoomLeft,
    handleUserJoined,
    handleUserLeft,
    handleRoomError,
    handleRoomList,
    handleRoomHistory,
  } = handlers;

  return {
    'heightChange': handleHeightChange,
    'connect OK': handleConnectOK,
    'history': handleHistory,
    'docs': handleDocsHistory,
    // チャット関連のイベント
    'chat-message': handleChatMessage,
    'positive': handlePositive,
    'negative': handleNegative,
    // Doc系のイベント
    'doc-add': handleDocAdd,
    'doc-error': handleDocError,
    'Lock-permitted': handleLockPermitted,
    'row-locked': handleRowLocked,
    'row-unlocked': handleRowUnlocked,
    'Lock-not-allowed': handleLockNotAllowed,
    'doc-edit': handleDocEdit,
    'doc-reorder': handleDocReorder,
    'doc-delete': handleDocDelete,
    'doc-indent-change': handleIndentChange,
    // Space関連のイベント
    'space-joined': handleRoomJoined,
    'space-left': handleRoomLeft,
    'other-user-joined': handleUserJoined,
    'other-user-left': handleUserLeft,
    'space-error': handleRoomError,
    'space-info': handleRoomList,
    'space-history': handleRoomHistory,
    // エラーハンドリング
    'connect_error': handleConnectError,
    'disconnect': handleDisconnect,
  };
};
