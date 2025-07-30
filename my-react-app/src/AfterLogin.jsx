// File: my-react-app/src/AfterLogin.jsx

import ResizablePanels from './ResizablePanels'
import InputForm from './InputForm'
import Telomere from './Telomere';

import sizeStore from './store/sizeStore';
import useAppStore from './store/appStore';

export default function AfterLogin({ heightArray, appController, userInfo }) {
    // userInfoをpropsから受け取る
    const { nickname, status, ageGroup, userId } = userInfo;

    // カラフルモードの状態管理
    const { isColorfulMode, toggleColorfulMode } = useAppStore();

    // appControllerから必要な関数を抽出
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

            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                margin: '8px 0' 
            }}>
                <h6 style={{ fontSize: '20px', margin: '0', textAlign: 'left' }}>
                    {`Logged in as  ${nickname} (${status}, ${ageGroup})`}
                </h6>
                
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px' 
                }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>
                        {isColorfulMode ? 'カラフル' : 'シンプル'}
                    </span>
                    <label style={{ 
                        position: 'relative', 
                        display: 'inline-block', 
                        width: '50px', 
                        height: '24px' 
                    }}>
                        <input
                            type="checkbox"
                            checked={isColorfulMode}
                            onChange={toggleColorfulMode}
                            style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: isColorfulMode ? '#4CAF50' : '#ccc',
                            transition: '0.4s',
                            borderRadius: '24px',
                            '&:before': {
                                position: 'absolute',
                                content: '""',
                                height: '18px',
                                width: '18px',
                                left: isColorfulMode ? '26px' : '3px',
                                bottom: '3px',
                                backgroundColor: 'white',
                                transition: '0.4s',
                                borderRadius: '50%'
                            }
                        }}>
                            <span style={{
                                position: 'absolute',
                                height: '18px',
                                width: '18px',
                                left: isColorfulMode ? '26px' : '3px',
                                bottom: '3px',
                                backgroundColor: 'white',
                                transition: '0.4s',
                                borderRadius: '50%'
                            }} />
                        </span>
                    </label>
                </div>
            </div>

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

                <ResizablePanels appController={appController} />

                <Telomere heightArray={heightArray} CONTAINER_HEIGHT={CONTAINER_2_HEIGHT} />

            </div>

            <InputForm nickname={nickname} status={status} ageGroup={ageGroup} userId={userId} appController={appController} />
        </div>
    );
}