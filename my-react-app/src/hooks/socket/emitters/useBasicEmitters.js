import useAppStore from '../../../store/appStore';
import { validUserId } from '../utils/socketUtils';

export const useBasicEmitters = (socket, emitLog) => {
  const emitLoginName = () => {
    const { userInfo } = useAppStore.getState();
    socket.emit('login', userInfo);
    emitLog({
      userId: validUserId(userInfo && userInfo._id),
      action: 'login',
      detail: { user: userInfo && userInfo.nickname }
    });
  };

  const emitHeightChange = (height) => {
    socket.emit('heightChange', height);
  };

  return {
    emitLoginName,
    emitHeightChange
  };
};
