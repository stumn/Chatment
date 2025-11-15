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
            const favCount = messages[i].positive || messages[i].fav || 0;
            const fontSize = STANDARD_FONT_SIZE + favCount * 2;

            // チャット行の高さ計算：
            // - ユーザー情報行（固定15px）
            // - メッセージ行（動的フォントサイズ）
            // - .chat-cMsgのパディング（上下4px x 2 = 8px）
            // - ボーダー（1px）
            // - 行間マージン（2px）
            const userInfoHeight = 15;
            const messageHeight = fontSize;
            const paddingHeight = 8; // 上下パディング
            const borderHeight = 1;
            const marginHeight = 2;
            const lineHeight = userInfoHeight + messageHeight + paddingHeight + borderHeight + marginHeight;

            if (totalHeight + lineHeight > newBottomHeight) break;

            totalHeight += lineHeight;
            lineCount++;
        }

        lineCount = Math.round(lineCount / 1.8); // チャット行は2行構造なので調整係数を1.8に変更
        // lineCount++; // 最低でも1行は表示する

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


            const data = {
                userId: userInfo && userInfo._id,
                action: 'slide-bar-move',
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
                id='slide-bar'
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
