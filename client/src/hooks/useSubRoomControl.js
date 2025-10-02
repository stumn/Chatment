import { useMemo } from 'react';
import useRoomStore from '../store/spaces/roomStore';
import useAppStore from '../store/spaces/appStore';

/**
 * サブルーム制御のためのカスタムフック
 * 
 * サブルーム機能の表示制御、状態管理、ロジックを集約
 * 
 * @returns {Object} サブルーム制御のためのメソッドと状態
 */
export const useSubRoomControl = () => {
  const { 
    rooms, 
    subRoomSettings, 
    currentSpaceInfo,
    isSubRoomEnabled,
    getDefaultRoomId
  } = useRoomStore();
  
  const { userInfo } = useAppStore();

  // サブルーム一覧を表示するべきかを判定
  const shouldShowRoomList = useMemo(() => {
    // サブルーム機能が有効かつ複数ルームが存在するかチェック
    const shouldShow = isSubRoomEnabled(true); // requireMultipleRooms = true
    
    if (!shouldShow) {
      console.log('🔍 [useSubRoomControl] サブルーム表示条件未満 - ルーム一覧非表示');
      return false;
    }
    
    console.log('🔍 [useSubRoomControl] サブルーム表示条件満たす - ルーム一覧表示');
    return true;
  }, [rooms, isSubRoomEnabled]);

  // 現在のスペースID
  const currentSpaceId = useMemo(() => {
    return userInfo?.spaceId || currentSpaceInfo?.id || 0;
  }, [userInfo?.spaceId, currentSpaceInfo?.id]);

  // デフォルトルームID
  const defaultRoomId = useMemo(() => {
    return `space${currentSpaceId}-main`;
  }, [currentSpaceId]);

  // サブルーム一覧（全体を除く）
  const subRooms = useMemo(() => {
    return rooms.filter(room => room.id !== defaultRoomId);
  }, [rooms, defaultRoomId]);

  // 全体ルーム
  const mainRoom = useMemo(() => {
    return rooms.find(room => room.id === defaultRoomId);
  }, [rooms, defaultRoomId]);

  // サブルーム設定の詳細情報
  const subRoomInfo = useMemo(() => {
    if (!subRoomSettings) return null;
    
    return {
      enabled: subRoomSettings.enabled,
      roomCount: rooms.length
    };
  }, [subRoomSettings, rooms]);

  // UIに表示する情報を決定
  const displayInfo = useMemo(() => {
    return {
      showRoomList: shouldShowRoomList,
      showMainRoomOnly: !shouldShowRoomList,
      hasSubRooms: subRooms.length > 0,
      roomCount: rooms.length,
      spaceId: currentSpaceId
    };
  }, [shouldShowRoomList, subRooms, rooms, currentSpaceId]);

  // デバッグ情報
  const debugInfo = useMemo(() => {
    return {
      subRoomSettings,
      currentSpaceInfo,
      userInfo: userInfo ? { spaceId: userInfo.spaceId, nickname: userInfo.nickname } : null,
      rooms: rooms.map(r => ({ id: r.id, name: r.name }))
    };
  }, [subRoomSettings, currentSpaceInfo, userInfo, rooms]);

  return {
    // 状態
    shouldShowRoomList,
    currentSpaceId,
    defaultRoomId,
    subRooms,
    mainRoom,
    subRoomInfo,
    displayInfo,
    debugInfo,
    
    // メソッド
    isSubRoomEnabled,
    getDefaultRoomId: () => defaultRoomId,
    
    // ヘルパー関数
    isMainRoom: (roomId) => roomId === defaultRoomId,
    isSubRoom: (roomId) => roomId !== defaultRoomId,
    getRoomById: (roomId) => rooms.find(room => room.id === roomId),
    
    // ログ出力
    logCurrentState: () => {
      console.log('🔍 [useSubRoomControl] 現在の状態:', {
        shouldShowRoomList,
        isSubRoomEnabled: isSubRoomEnabled(),
        roomCount: rooms.length,
        spaceId: currentSpaceId,
        subRoomSettings,
        debugInfo
      });
    }
  };
};

export default useSubRoomControl;