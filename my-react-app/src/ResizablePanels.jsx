// ResizablePanels.jsx

import { useState, useEffect, useMemo } from "react";
import Paper from "@mui/material/Paper";

import ChatComments from "./ChatComments";
import DocComments from "./docComments";

import useSizeStore from "./store/sizeStore";
import useAppStore from "./store/appStore";
import usePostStore from "./store/postStore";

export default function ResizablePanels({ appController }) {

    // sizeStore から取得
    const CONTAINER_resizable_WIDTH = useSizeStore((state) => state.width);
    const CONTAINER_resizable_HEIGHT = useSizeStore((state) => state.height) * 0.8;

    // useAppStore から取得
    const { myHeight, setMyHeight } = useAppStore();
    const { userInfo } = useAppStore();

    // ✅ 修正: appControllerから必要な関数を取得
    const { raw: { emitLog } } = appController;

    // Document操作用の関数群を抽出
    const documentFunctions = {
        document: appController.document,
        chat: appController.chat.send, // sendChatMessage
    };

    // Chat操作用の関数群を抽出  
    const chatFunctions = {
        chat: appController.chat,
        socket: appController.socket
    };

    const DIVIDER_HEIGHT = 15;
    const STANDARD_FONT_SIZE = 16; // スタートのフォントサイズ
    const MAX_TOP_HEIGHT = CONTAINER_resizable_HEIGHT - DIVIDER_HEIGHT - STANDARD_FONT_SIZE * 5; // 最大の高さは、下部の高さを考慮して調整

    const bottomHeight = CONTAINER_resizable_HEIGHT - DIVIDER_HEIGHT - myHeight;

    const posts = usePostStore((state) => state.posts);
    // ❌ 問題: 毎回ソートが実行されるため、大量のデータでパフォーマンスが低下する可能性があります
    // ✅ 修正案: useMemoの依存配列を最適化し、posts.lengthも考慮する
    const messages = useMemo(() => {
        const sorted = [...posts].sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return aTime - bTime;
        });
        return sorted;
    }, [posts]);

    const [lines, setLines] = useState({ num: 5, timestamp: 0 }); // 初期値は4行分の高さ
    useEffect(() => {
        const newLines = calculateLines(bottomHeight);
        setLines({ num: newLines, timestamp: Date.now() });

        if (newLines === lines.num) return; // 行数が変わらない場合は更新しない

        // ✅ 修正: ログの送信を制限（デバッグ目的でのみ送信）
        if (process.env.NODE_ENV === 'development') {
            const data = {
                userId: userInfo && userInfo._id,
                action: 'calculate-lines',
                detail: {
                    height: bottomHeight,
                    lines: newLines,
                    user: userInfo && userInfo.nickname
                }
            };
            console.log("emitLog:", data);
            // emitLog(data); // ✅ 修正: 本番環境では送信しない
        }

    }, [bottomHeight, messages]);

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
        lineCount = Math.round(lineCount / 2.2); // 推定行数を見た目に調整（経験的に2.2で割るとよい感じ）

        return lineCount;
    };

    const handleMouseDown = (event) => {
        const startY = event.clientY;
        const startHeight = myHeight;

        const onMouseMove = (moveEvent) => {
            const currentY = moveEvent.clientY;
            let newTopHeight = Math.max(startHeight + (currentY - startY), STANDARD_FONT_SIZE * 3.5);
            newTopHeight = Math.max(STANDARD_FONT_SIZE * 2, Math.min(MAX_TOP_HEIGHT, newTopHeight));
            setMyHeight(newTopHeight);
            document.getElementById('slide-bar').style.backgroundColor = `rgba(4, 149, 35, 0.51)`;
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            document.getElementById('slide-bar').style.backgroundColor = `rgba(53, 59, 72, 0.6)`;

            // ✅ 修正: スライドバーログも制限
            if (process.env.NODE_ENV === 'development') {
                const data = {
                    userId: userInfo && userInfo._id,
                    action: 'slide-bar-move',
                    detail: {
                        from: startY,
                        to: startHeight,
                        user: userInfo && userInfo.nickname
                    }
                };
                console.log("emitLog:", data);
                // emitLog(data); // ✅ 修正: 本番環境では送信しない
            }
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    return (
        <Paper
            elevation={3}
            style={{
                width: `${CONTAINER_resizable_WIDTH}px`,
                height: `${CONTAINER_resizable_HEIGHT}px`,
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
                style={{ backgroundColor: "#fefefe", height: `${myHeight}px` }}>
                <DocComments lines={lines} documentFunctions={documentFunctions} />
            </div>

            <div
                id='slide-bar'
                style={{
                    height: `${DIVIDER_HEIGHT}px`,
                    width: `${CONTAINER_resizable_WIDTH}px`,
                    backgroundColor: "rgba(53, 59, 72, 0.6)",
                    cursor: "row-resize"
                }}
                onMouseDown={handleMouseDown}
            />

            <div
                id='chat-container'
                style={{ flexGrow: 1, backgroundColor: "#fefefe", height: `${bottomHeight}px` }}>
                <ChatComments lines={lines} bottomHeight={bottomHeight} chatFunctions={chatFunctions} />
            </div>
        </Paper>
    );
}
