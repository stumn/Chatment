// File: client/src/AfterLogin.jsx

import ResizablePanels from './ResizablePanels'
import InputForm from './InputForm'
import Telomere from './Telomere';
import Sidebar from './Sidebar';

import sizeStore from './store/sizeStore';
import useAppStore from './store/appStore';

export default function AfterLogin({ heightArray, appController, userInfo }) {
    // userInfoをpropsから受け取る
    const { nickname, status, ageGroup, userId } = userInfo;

    // サイドバーの状態管理
    const { isTocOpen, toggleToc } = useAppStore();

    // after-login-containerの幅・高さを設定(sizeStore から取得)
    const CONTAINER_1_WIDTH = sizeStore((state) => state.width);
    const CONTAINER_1_HEIGHT = sizeStore((state) => state.height);

    // resizable-containerの幅・高さを設定(計算)
    const CONTAINER_2_WIDTH = CONTAINER_1_WIDTH; // 100%の幅
    const CONTAINER_2_HEIGHT = CONTAINER_1_HEIGHT * 0.85; //85%の高さ

    // 目次が開いている場合のレイアウト調整
    const tocOffset = isTocOpen ? 80 : 0; // 目次の幅分オフセット

    return (
        <div
            id="after-login-container"
            style={{
                paddingTop: '1.5rem',
                paddingBottom: '1.5rem',
                width: `${CONTAINER_1_WIDTH}px`,
                height: `${CONTAINER_1_HEIGHT}px`,
                marginLeft: `${tocOffset}px`, // 目次が開いている場合は右にシフト
                transition: 'margin-left 0.3s ease' // スムーズな移動
            }}>

            {/* 目次コンポーネント */}
            <Sidebar isOpen={isTocOpen} onToggle={toggleToc} />

            <div
                id="resizable-container"
                style={{
                    width: `${CONTAINER_2_WIDTH - tocOffset}px`, // 目次の幅分を引く
                    height: `${CONTAINER_2_HEIGHT}px`,
                    display: 'flex',
                    flexDirection: 'row', // Change to row for horizontal layout
                    alignItems: 'flex-start', // Align items at the top
                    gap: '4px', // Add spacing between elements
                    transition: 'width 0.3s ease' // スムーズな幅変更
                }}>

                <ResizablePanels appController={appController} />

                <Telomere heightArray={heightArray} CONTAINER_HEIGHT={CONTAINER_2_HEIGHT} />

            </div>

            <InputForm nickname={nickname} status={status} ageGroup={ageGroup} userId={userId} appController={appController} />
        </div>
    );
}