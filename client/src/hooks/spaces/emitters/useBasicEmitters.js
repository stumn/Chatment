import useAppStore from '../../../store/spaces/appStore';
import { validUserId } from '../socketUtils/socketUtils';

export const useBasicEmitters = (socket, emitLog) => {

  const emitLoginName = () => {
    const { userInfo } = useAppStore.getState();
    socket.emit('login', userInfo);
  };

  const emitHeightChange = (newHeight, prevHeight) => {
    const { userInfo } = useAppStore.getState();
    // テロメア表示のためサーバーに送信（ログは記録しない）
    socket.emit('heightChange', newHeight);
  };

  return {
    emitLoginName,
    emitHeightChange
  };
};
