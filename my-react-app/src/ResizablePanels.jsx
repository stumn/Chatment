import { useState, useEffect } from "react";
import ChatComments from "./ChatComments";
import DocComments from "./docComments";
import Paper from "@mui/material/Paper";

const CONTAINER_WIDTH = Math.min(1200, Math.max(400, window.innerWidth * 0.7)); // 画面サイズに応じて幅を調整
const CONTAINER_HEIGHT = Math.min(800, Math.max(500, window.innerHeight * 0.8)); // 画面サイズに応じて高さを調整
const DIVIDER_HEIGHT = 20;
const STANDARD_FONT_SIZE = 16; // スタートのフォントサイズ
const MAX_TOP_HEIGHT = CONTAINER_HEIGHT - DIVIDER_HEIGHT - STANDARD_FONT_SIZE * 2; // 最大の高さは、下部の高さを考慮して調整

export default function ResizablePanels({ topHeight, setTopHeight, chatMessages, docMessages, onChangeDoc, onChangeLines, onUpdateFav }) {
    

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
            const fontSize = STANDARD_FONT_SIZE + favCount * 2;
            const lineHeight = fontSize + 12;

            if (totalHeight + lineHeight > newBottomHeight) break;

            totalHeight += lineHeight;
            lineCount++;
        }

        if (lineCount === 0) lineCount = 1; // 最低でも1行は表示する

        return lineCount;
    };

    const slicedChatMessages = chatMessages.slice(-calculateLines(bottomHeight));

    const handleMouseDown = (event) => {
        const startY = event.clientY;
        const startHeight = topHeight;

        const onMouseMove = (moveEvent) => {
            const currentY = moveEvent.clientY;
            let newTopHeight = startHeight + (currentY - startY);
            newTopHeight = Math.max(STANDARD_FONT_SIZE * 2, Math.min(MAX_TOP_HEIGHT, newTopHeight));
            setTopHeight(newTopHeight);
            console.log("Top Height (resizable):", newTopHeight); // デバッグ用
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
        </Paper>
    );
}
