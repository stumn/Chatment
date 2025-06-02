import ResizablePanels from './ResizablePanels'
import InputForm from './InputForm'
import Telomere from './Telomere';
import sizeStore from './store/sizeStore';

export default function AfterLogin({ myHeight, setMyHeight, heightArray, isName, onLogout }) {

    // sizeStore から取得
    const CONTAINER_WIDTH = sizeStore((state) => state.width);
    const CONTAINER_HEIGHT = sizeStore((state) => state.height);
    
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
                    height: `${CONTAINER_HEIGHT * 0.8}px`,
                    display: 'flex',
                    flexDirection: 'row', // Change to row for horizontal layout
                    alignItems: 'flex-start', // Align items at the top
                    gap: '4px', // Add spacing between elements
                }}>

                <ResizablePanels
                    myHeight={myHeight}
                    setMyHeight={setMyHeight}
                />

                <Telomere heightArray={heightArray} CONTAINER_HEIGHT={CONTAINER_HEIGHT * 0.8} />

            </div>

            <InputForm name={isName} />
        </div>
    );
}