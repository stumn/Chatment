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
    handlePollUpdate,
    handlePollError,

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
    handleRoomInfo,
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
    'poll-update': handlePollUpdate,
    'poll-error': handlePollError,
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
    // Room関連のイベント
    'room-joined': handleRoomJoined,
    'room-left': handleRoomLeft,
    'user-joined': handleUserJoined,
    'user-left': handleUserLeft,
    'room-error': handleRoomError,
    'room-list': handleRoomList,
    'room-info': handleRoomInfo,
    'room-history': handleRoomHistory,
    // エラーハンドリング
    'connect_error': handleConnectError,
    'disconnect': handleDisconnect,
  };
};
