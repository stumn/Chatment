import { useState } from "react";
import ChatComments from "./ChatComments";
import DocComments from "./docComments";

const CONTAINER_HEIGHT = 600;
const DIVIDER_HEIGHT = 20;
const MAX_TOP_HEIGHT = CONTAINER_HEIGHT - DIVIDER_HEIGHT; // トップパネルの最大値

export default function ResizablePanels({ chatMessages, docMessages, onChangeDoc, onMouseDragging }) {
    const [topHeight, setTopHeight] = useState(460);
    const bottomHeight = CONTAINER_HEIGHT - DIVIDER_HEIGHT - topHeight;
    const lines = Math.max(0, Math.floor(((bottomHeight - 32) / 24)));

    const handleMouseDown = (event) => {
        const startY = event.clientY;
        const startHeight = topHeight;

        const onMouseMove = (moveEvent) => {
            updateHeight(moveEvent.clientY);
        };

        const onMouseUp = (moveEvent) => {
            updateHeight(moveEvent.clientY);
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        function updateHeight(currentY) {
            let newTopHeight = startHeight + (currentY - startY);
            newTopHeight = Math.max(0, Math.min(MAX_TOP_HEIGHT, newTopHeight)); // 0～MAX_TOP_HEIGHTの範囲に制限
            setTopHeight(newTopHeight);

            // 新しいbottomHeightに基づいてライン数を再計算
            const newBottomHeight = CONTAINER_HEIGHT - DIVIDER_HEIGHT - newTopHeight;
            const newLines = Math.max(0, Math.floor((newBottomHeight - 32) / 24));
            onMouseDragging(newLines);
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    return (
        <>
            <span>`topHeight: {topHeight}, bottomHeight: {bottomHeight}, total: {topHeight + bottomHeight}, lines: {lines}`</span>
            <div style={{ width: "90vw", height: `${CONTAINER_HEIGHT}`, display: "flex", flexDirection: "column" }}>
                <div style={{ paddingTop: "5px", backgroundColor: "#fefefe", height: `${topHeight}px`, }}>
                    <DocComments docMessages={docMessages} onChangeDoc={onChangeDoc} />
                </div>
                <div
                    style={{ height: `${DIVIDER_HEIGHT}px`, backgroundColor: "rgba(53, 59, 72, 0.6)", cursor: "row-resize", }}
                    onMouseDown={handleMouseDown}
                />
                <div style={{ flexGrow: 1, paddingTop: "5px", backgroundColor: "#fefefe", height: `${bottomHeight}px` }}>
                    <ChatComments chatMessages={chatMessages} />
                </div>
            </div>
        </>
    );
}
