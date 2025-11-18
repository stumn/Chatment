// ResizablePanels.jsx 

import { useState, useEffect, useMemo } from "react";

import ChatComments from "./ChatComments";
import DocComments from "./docComments";

import useSizeStore from "../../store/shared/sizeStore";
import useAppStore from "../../store/spaces/appStore";
import usePostStore from "../../store/spaces/postStore";
import useRoomStore from "../../store/spaces/roomStore";

export default function ResizablePanels({ appController, spaceId }) {

    // sizeStore から取得
    const CONTAINER_resizable_WIDTH = useSizeStore((state) => state.width);
    const CONTAINER_resizable_HEIGHT = useSizeStore((state) => state.height) * 0.82; // 82%の高さ

    // useAppStore から取得
    const { myHeight, setMyHeight } = useAppStore();
    const { userInfo } = useAppStore();

    // ルーム情報を取得
    const { activeRoomId, rooms } = useRoomStore();
    const currentRoom = rooms.find(room => room.id === activeRoomId);

    // ルーム変更を監視してログ出力
    useEffect(() => {
        if (!activeRoomId) {
            console.log(`⏳ [ResizablePanels] ルーム参加待機中...`);
        } else if (currentRoom) {
            console.log(`[ResizablePanels] 表示ルーム変更: 
                ${currentRoom?.name} (${currentRoom?.id}) 
                ${currentRoom?.participantCount}人参加中`);
        } else {
            console.log(`⚠️ [ResizablePanels] ルーム情報が見つかりません: ${activeRoomId}`);
        }
    }, [activeRoomId, currentRoom]);

    const { raw: { emitLog } } = appController;

    // Document操作用の関数群を抽出
    const documentFunctions = {
        document: appController.document,
        chat: appController.chat.send, // sendChatMessage
        spaceId: spaceId, // spaceIdを追加
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
    // useMemoの依存配列を最適化し、posts.lengthも考慮する
    const messages = useMemo(() => {
        const sorted = [...posts].sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return aTime - bTime;
        });
        return sorted;
    }, [posts.length, posts.map(p => p.createdAt).join(',')]); // より効率的な依存配列

    const [lines, setLines] = useState({ num: null, timestamp: 0 });

    useEffect(() => {
        const newLines = calculateLines(bottomHeight);
        setLines({ num: newLines, timestamp: Date.now() });

        if (newLines === lines.num) return; // 行数が変わらない場合は更新しない

        const data = {
            userId: userInfo && userInfo._id,
            action: 'calculate-lines',
            detail: {
                height: bottomHeight,
                lines: newLines,
                user: userInfo && userInfo.nickname
            }
        };
        emitLog(data);

    }, [bottomHeight, messages]);

    const calculateLines = (newBottomHeight) => {
        let totalHeight = 0;
        let lineCount = 0;

        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            const diff = (msg.positive || 0) - (msg.negative || 0);

            // 実際のChatRow.jsxと同じ計算ロジック
            let baseFontSize = 15 + diff * 2;
            if (baseFontSize > 30) baseFontSize = 30;
            if (baseFontSize < 10) baseFontSize = 10;

            // 見出し判定
            const isHeading = msg.msg && msg.msg.trim().startsWith('#');
            const fontSize = isHeading ? Math.max(baseFontSize * 1.5, 22) : baseFontSize;

            // 実際のCSS仕様に基づく計算（line-height: 1.2を考慮）
            // - ユーザー情報行: 15px * 1.2 = 18px
            // - メッセージ行: fontSize * 1.2
            // - パディング: 上下4px × 2 = 8px
            // - ボーダー: 1px
            const userInfoHeight = 15 * 1.2; // 18px
            const messageHeight = fontSize * 1.2; // line-height考慮
            const paddingHeight = 8; // py-1 (上下4px)
            const borderHeight = 1;
            const lineHeight = userInfoHeight + messageHeight + paddingHeight + borderHeight;

            if (totalHeight + lineHeight > newBottomHeight) break;

            totalHeight += lineHeight;
            lineCount++;
        }

        return lineCount; // 調整係数なしで正確な行数を返す
    };

    const handleMouseDown = (event) => {
        const startY = event.clientY;
        const startHeight = myHeight;

        const onMouseMove = (moveEvent) => {
            const currentY = moveEvent.clientY;
            let newTopHeight = Math.max(startHeight + (currentY - startY), STANDARD_FONT_SIZE * 3.5);
            newTopHeight = Math.max(STANDARD_FONT_SIZE * 2, Math.min(MAX_TOP_HEIGHT, newTopHeight));
            setMyHeight(newTopHeight);
            document.getElementById('divider').style.backgroundColor = `rgba(4, 149, 35, 0.51)`;
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            document.getElementById('divider').style.backgroundColor = `rgba(53, 59, 72, 0.6)`;


            const data = {
                userId: userInfo && userInfo._id,
                action: 'divider-move',
                detail: {
                    from: startY,
                    to: startHeight,
                    user: userInfo && userInfo.nickname
                }
            };
            emitLog(data);

        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    return (
        <div
            id='resizable-panels'
            className="flex flex-col bg-[var(--page-bg,#fefefe)] text-[#4A4A4A] shadow-[0_4px_0_rgba(0,0,0,.16)] rounded-t"
            style={{
                width: `${CONTAINER_resizable_WIDTH}px`,
                height: `${CONTAINER_resizable_HEIGHT}px`,
            }}
        >
            <div
                id='doc-container'
                className="bg-[#fefefe]"
                style={{ height: `${myHeight}px` }}>
                <DocComments lines={lines} documentFunctions={documentFunctions} />
            </div>

            <div
                id='divider'
                className="bg-gray-600/60 cursor-row-resize"
                style={{
                    height: `${DIVIDER_HEIGHT}px`,
                    width: `${CONTAINER_resizable_WIDTH}px`,
                }}
                onMouseDown={handleMouseDown}
            />

            <div
                id='chat-container'
                className="flex-grow bg-[#fefefe]"
                style={{ height: `${bottomHeight}px` }}>
                <ChatComments lines={lines} bottomHeight={bottomHeight} chatFunctions={chatFunctions} />
            </div>
        </div>
    );
}
