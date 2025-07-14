// File: my-react-app/src/AfterLogin.jsx

import ResizablePanels from './ResizablePanels'
import InputForm from './InputForm'
import Telomere from './Telomere';

import sizeStore from './store/sizeStore';
import useAppStore from './store/appStore';

export default function AfterLogin({ heightArray, appController, userInfo }) {
    // userInfoをpropsから受け取る
    const { nickname, status, ageGroup, userId } = userInfo;

    // ✅ 修正: appControllerから必要な関数を抽出
    const { chat } = appController;

    // after-login-containerの幅・高さを設定(sizeStore から取得)
    const CONTAINER_1_WIDTH = sizeStore((state) => state.width);
    const CONTAINER_1_HEIGHT = sizeStore((state) => state.height);

    // resizable-containerの幅・高さを設定(計算)
    const CONTAINER_2_WIDTH = CONTAINER_1_WIDTH; // 100%の幅
    const CONTAINER_2_HEIGHT = CONTAINER_1_HEIGHT * 0.8; //80%の高さ

    return (
        <div
            id="after-login-container"
            style={{ width: `${CONTAINER_1_WIDTH}px`, height: `${CONTAINER_1_HEIGHT}px` }}>

            <h6 style={{ fontSize: '20px', margin: '8px 0', textAlign: 'left' }}>
                {`Logged in as  ${nickname} (${status}, ${ageGroup})`}
            </h6>

            <div
                id="resizable-container"
                style={{
                    width: `${CONTAINER_2_WIDTH}px`,
                    height: `${CONTAINER_2_HEIGHT}px`,
                    display: 'flex',
                    flexDirection: 'row', // Change to row for horizontal layout
                    alignItems: 'flex-start', // Align items at the top
                    gap: '4px', // Add spacing between elements
                }}>

                {/* ✅ 修正: appControllerを渡すように変更 */}
                <ResizablePanels appController={appController} />

                <Telomere heightArray={heightArray} CONTAINER_HEIGHT={CONTAINER_2_HEIGHT} />

            </div>

            {/* ✅ 修正: InputFormにappControllerを渡す */}
            <InputForm nickname={nickname} status={status} ageGroup={ageGroup} userId={userId} appController={appController} />
        </div>
    );
}