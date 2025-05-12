import { useState, useEffect, use } from "react";
import ChatComments from "./ChatComments";
import DocComments from "./docComments";
import Paper from "@mui/material/Paper";
import useChatStore from "./store/chatStore";

export default function ResizablePanels({ myHeight, setMyHeight, CONTAINER_WIDTH, CONTAINER_HEIGHT }) {
    const DIVIDER_HEIGHT = 20;
    const STANDARD_FONT_SIZE = 16; // スタートのフォントサイズ
    const MAX_TOP_HEIGHT = CONTAINER_HEIGHT - DIVIDER_HEIGHT - STANDARD_FONT_SIZE * 5; // 最大の高さは、下部の高さを考慮して調整

    const bottomHeight = CONTAINER_HEIGHT - DIVIDER_HEIGHT - myHeight;
    const messages = useChatStore((state) => state.messages);

    const [lines, setLines] = useState({ num: 3, timestamp: 0 }); // 初期値は1行分の高さ
    useEffect(() => {
        const newLines = calculateLines(bottomHeight);
        setLines({ num: newLines, timestamp: Date.now() });
    }, [bottomHeight, messages]);

    // サイズ変更
    // useEffect(() => {
    //     const handleResize = () => {
    //         const newBottomHeight = CONTAINER_HEIGHT - DIVIDER_HEIGHT - myHeight;
    //         const newLines = calculateLines(newBottomHeight);
    //         setLines(newLines);
    //     };

    //     window.addEventListener("resize", handleResize);
    //     return () => {
    //         window.removeEventListener("resize", handleResize);
    //     };
    // }, [myHeight, CONTAINER_HEIGHT]);

    const calculateLines = (newBottomHeight) => {
        let totalHeight = 0;
        let lineCount = 0;

        for (let i = messages.length - 1; i >= 0; i--) {
            const favCount = messages[i].fav || 0;
            const fontSize = STANDARD_FONT_SIZE + favCount * 2;
            const lineHeight = fontSize + 12;

            if (totalHeight + lineHeight > newBottomHeight) break;

            totalHeight += lineHeight;
            lineCount++;
        }

        if (lineCount === 0) lineCount = 1; // 最低でも1行は表示する
        lineCount = Math.round(lineCount / 2.2);

        console.log("Line Count:", lineCount); // デバッグ用
        return lineCount; // 1行の余白を加算
    };

    const handleMouseDown = (event) => {
        const startY = event.clientY;
        const startHeight = myHeight;

        const onMouseMove = (moveEvent) => {
            const currentY = moveEvent.clientY;
            let newTopHeight = Math.max(startHeight + (currentY - startY), STANDARD_FONT_SIZE * 3.5);
            newTopHeight = Math.max(STANDARD_FONT_SIZE * 2, Math.min(MAX_TOP_HEIGHT, newTopHeight));
            setMyHeight(newTopHeight);
            console.log("Top Height (resizable):", newTopHeight); // デバッグ用
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    return (
        <Paper
            elevation={3}
            style={{
                width: `${CONTAINER_WIDTH}px`,
                height: `${CONTAINER_HEIGHT}px`,
                display: "flex",
                flexDirection: "column",
                backgroundColor: 'var(--page-bg, #fefefe)',
                color: '#4A4A4A',
                boxShadow: '0 4px 0 rgba(0,0,0,.16)',
                borderTopLeftRadius: '4px',
                borderTopRightRadius: '4px',
            }}
        >
            <div
                id='doc-container'
                style={{ paddingTop: "5px", backgroundColor: "#fefefe", height: `${myHeight}px` }}>
                <DocComments myHeight={myHeight} lines={lines} />
            </div>

            <div
                id='slide-bar'
                style={{ height: `${DIVIDER_HEIGHT}px`, backgroundColor: "rgba(53, 59, 72, 0.6)", cursor: "row-resize" }}
                onMouseDown={handleMouseDown}
            />

            <div
                id='chat-container'
                style={{ flexGrow: 1, paddingTop: "5px", backgroundColor: "#fefefe", height: `${bottomHeight}px` }}>
                <ChatComments lines={lines} />
            </div>
        </Paper>
    );
}
