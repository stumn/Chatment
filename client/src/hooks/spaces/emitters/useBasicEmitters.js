import useAppStore from '../../../store/spaces/appStore';
import { validUserId } from '../socketUtils/socketUtils';

export const useBasicEmitters = (socket, emitLog) => {

  const emitLoginName = () => {
    const { userInfo } = useAppStore.getState();
    socket.emit('login', userInfo);
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      action: 'login',
      detail: { user: userInfo && userInfo.nickname, spaceId: userInfo.spaceId }
    });
  };

  const emitHeightChange = (height, prevHeight) => {
    const { userInfo } = useAppStore.getState();
    socket.emit('heightChange', height);
    
    // ログ記録
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      userNickname: userInfo && userInfo.nickname,
      action: 'height-change',
      detail: { 
        newHeight: height,
        oldHeight: prevHeight,
        spaceId: userInfo && userInfo.spaceId
      }
    });
  };

  return {
    emitLoginName,
    emitHeightChange
  };
};
