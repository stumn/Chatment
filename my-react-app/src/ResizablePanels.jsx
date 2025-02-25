import { useState } from "react";
import ChatComments from "./ChatComments";

export default function ResizablePanels({ messages }) {
    const [topHeight, setTopHeight] = useState(50); // 初期は50%の高さ

    const handleMouseDown = (event) => {
        const startY = event.clientY;
        const startHeight = topHeight;

        const onMouseMove = (moveEvent) => {
            const delta = ((moveEvent.clientY - startY) / window.innerHeight) * 100;
            setTopHeight(Math.min(90, Math.max(10, startHeight + delta))); // 10%~90%に制限
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    return (
        <>
            <div style={{ width: "80vw", height: "80vh", display: "flex", flexDirection: "column" }}>
                <div
                    style={{
                        backgroundColor: "#93c5fd",
                        height: `${topHeight}%`,
                    }}
                >
                    <ChatComments messages={messages}/>
                </div>
                <div
                    style={{
                        height: "10px",
                        backgroundColor: "#6b7280",
                        cursor: "row-resize",
                    }}
                    onMouseDown={handleMouseDown}
                />
                <div style={{ flexGrow: 1, backgroundColor: "#6ee7b7" }}>
                    <ChatComments messages={messages}/>
                </div>
            </div>
        </>
    );
}
