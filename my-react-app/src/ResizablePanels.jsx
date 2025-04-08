import { useState, useEffect } from "react";
import ChatComments from "./ChatComments";
import DocComments from "./docComments";

const CONTAINER_HEIGHT = 600;
const DIVIDER_HEIGHT = 20;
const MAX_TOP_HEIGHT = CONTAINER_HEIGHT - DIVIDER_HEIGHT;

export default function ResizablePanels({ chatMessages, docMessages, onChangeDoc, onChangeLines, onUpdateFav }) {
    const [topHeight, setTopHeight] = useState(460);

    const bottomHeight = CONTAINER_HEIGHT - DIVIDER_HEIGHT - topHeight;

    useEffect(() => {
        const newLines = calculateLines(bottomHeight);
        onChangeLines(newLines);
    }, [bottomHeight, chatMessages]);

    const calculateLines = (newBottomHeight) => {
        let totalHeight = 0;
        let lineCount = 0;

        for (let i = chatMessages.length - 1; i >= 0; i--) {
            const favCount = chatMessages[i].fav || 0;
            const fontSize = 16 + favCount * 2;
            const lineHeight = fontSize + 12;

            if (totalHeight + lineHeight > newBottomHeight) break;

            totalHeight += lineHeight;
            lineCount++;
        }

        return lineCount;
    };

    const slicedChatMessages = chatMessages.slice(-calculateLines(bottomHeight));
    
    const handleMouseDown = (event) => {
        const startY = event.clientY;
        const startHeight = topHeight;

        const onMouseMove = (moveEvent) => {
            const currentY = moveEvent.clientY;
            let newTopHeight = startHeight + (currentY - startY);
            newTopHeight = Math.max(0, Math.min(MAX_TOP_HEIGHT, newTopHeight));
            setTopHeight(newTopHeight);
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    const handleFavClick = (index) => {
        // slicedChatMessages はスライスされたメッセージの配列なので、元のインデックスを計算する必要があります。
        const originalIndex = chatMessages.length - calculateLines(bottomHeight) + index;
        onUpdateFav(originalIndex); // 親コンポーネントに更新を通知
    };

    return (
        <div style={{ width: "90vw", height: `${CONTAINER_HEIGHT}px`, display: "flex", flexDirection: "column" }}>
            <div style={{ paddingTop: "5px", backgroundColor: "#fefefe", height: `${topHeight}px` }}>
                <DocComments docMessages={docMessages} onChangeDoc={onChangeDoc} />
            </div>
            <div
                style={{ height: `${DIVIDER_HEIGHT}px`, backgroundColor: "rgba(53, 59, 72, 0.6)", cursor: "row-resize" }}
                onMouseDown={handleMouseDown}
            />
            <div style={{ flexGrow: 1, paddingTop: "5px", backgroundColor: "#fefefe", height: `${bottomHeight}px` }}>
                <ChatComments chatMessages={slicedChatMessages} onFavClick={handleFavClick} />
            </div>
        </div>
    );
}
