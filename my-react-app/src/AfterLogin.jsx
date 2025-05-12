import ResizablePanels from './ResizablePanels'
import InputForm from './InputForm'
import Telomere from './Telomere';

export default function AfterLogin({ myHeight, setMyHeight, heightArray, isName, onLogout }) {

    // const CONTAINER_WIDTH = Math.min(1000, Math.max(300, window.innerWidth * 0.7)); // 画面サイズに応じて幅を調整
    // const CONTAINER_HEIGHT = Math.min(700, Math.max(400, window.innerHeight * 0.8)); // 画面サイズに応じて高さを調整

    const CONTAINER_WIDTH = 1000; // 画面サイズに応じて幅を調整
    const CONTAINER_HEIGHT = 900; // 画面サイズに応じて高さを調整

    return (
        <div
            id="after-login-container"
            style={{ width: `${CONTAINER_WIDTH}px`, height: `${CONTAINER_HEIGHT}px` }}>

            <h6 style={{ fontSize: '20px', margin: '8px 0', textAlign: 'left' }}>
                {'Logged in as ' + isName}
            </h6>

            <div
                id="resizable-container"
                style={{
                    width: `${CONTAINER_WIDTH}px`,
                    height: `${CONTAINER_HEIGHT}px`,
                    display: 'flex',
                    flexDirection: 'row', // Change to row for horizontal layout
                    alignItems: 'flex-start', // Align items at the top
                    gap: '4px', // Add spacing between elements
                }}>

                <ResizablePanels
                    myHeight={myHeight}
                    setMyHeight={setMyHeight}
                    CONTAINER_WIDTH={CONTAINER_WIDTH}
                    CONTAINER_HEIGHT={CONTAINER_HEIGHT} // Adjust height for the resizable panel
                />

                <Telomere heightArray={heightArray} CONTAINER_HEIGHT={CONTAINER_HEIGHT} />

            </div>

            <InputForm name={isName} />
        </div>
    );
}