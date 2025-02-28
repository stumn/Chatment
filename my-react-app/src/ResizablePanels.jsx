import { useState } from "react";
import ChatComments from "./ChatComments";
import DocComments from "./docComments";

export default function ResizablePanels({ chatMessages, docMessages, onChangeDoc, onMouseDragging }) {
    const [topHeight, setTopHeight] = useState(200); // 初期は50%の高さ
    const bottomHeight = 490 - topHeight;

    const handleMouseDown = (event) => {
        const startY = event.clientY;
        console.log("mousedown", startY, "save: ", topHeight);

        const startHeight = topHeight;

        const onMouseMove = (moveEvent) => {
            console.log(moveEvent.clientY)
            // const delta = ((moveEvent.clientY - startY) / window.innerHeight) * 100;
            // setTopHeight(startHeight + delta);
            setTopHeight(startHeight + moveEvent.clientY - startY);
        };

        const onMouseUp = (moveEvent) => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            setTopHeight(startHeight + moveEvent.clientY - startY);
            console.log("mouseup", moveEvent.clientY, "save: ", topHeight);

            // リサイズ後の2つ目のパネルの高さから、行数を計算する
            // const bottomHeight = 100 - moveEvent.clientY / window.innerHeight * 100;
            console.log("bottomHeight", bottomHeight, "px");
            const lines = Math.floor((bottomHeight / 16));
            console.log("lines", lines);
            onMouseDragging(lines);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    return (
        <>
            <div style={{ width: "90vw", height: "500px", display: "flex", flexDirection: "column" }}>
                <div
                    style={{
                        backgroundColor: "#93c5fd",
                        height: `${topHeight}px`,
                    }}
                >
                    <DocComments docMessages={docMessages} onChangeDoc={onChangeDoc} />
                </div>
                <div
                    style={{
                        height: "10px",
                        backgroundColor: "#6b7280",
                        cursor: "row-resize",
                    }}
                    onMouseDown={handleMouseDown}
                />
                <div
                    style={{
                        flexGrow: 1,
                        backgroundColor: "#6ee7b7",
                        height: {bottomHeight},
                    }}>
                    <ChatComments chatMessages={chatMessages} />
                </div>
            </div>
        </>
    );
}
