// ResizablePanels.jsx 

import { useState, useEffect, useMemo } from "react";

import ChatComments from "./chat/ChatComments";
import DocComments from "./doc/DocComments";

import useSizeStore from "../../store/sizeStore";
import useAppStore from "../../store/spaces/appStore";
import usePostStore from "../../store/spaces/postStore";
import useRoomStore from "../../store/spaces/roomStore";

export default function ResizablePanels({ appController, spaceId, onScrollToItem }) {

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
            // ルーム参加待機中
        } else if (!currentRoom) {
            console.warn(`⚠️ [ルーム情報が見つかりません: ${activeRoomId}`);
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
    // postsが変更された時のみソートを実行
    const messages = useMemo(() => {
        return [...posts].sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return aTime - bTime;
        });
    }, [posts]);

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
        // 実測値: 1行は常に65px固定（positive/negativeに関係なく）
        // - ユーザー名行: 28px
        // - メッセージ行: 28px（1行のみ表示、長文は省略）
        // - パディング: 8px (上下4px × 2)
        // - ボーダー: 1px
        const FIXED_LINE_HEIGHT = 65;

        // 表示できる行数を計算
        const lineCount = Math.floor(newBottomHeight / FIXED_LINE_HEIGHT);

        return Math.max(lineCount, 1); // 最低1行は表示
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
                <DocComments lines={lines} documentFunctions={documentFunctions} onScrollToItem={onScrollToItem} />
            </div>

            <div
                id='divider'
                className="bg-gray-600/60 cursor-row-resize relative group"
                style={{
                    height: `${DIVIDER_HEIGHT}px`,
                    width: `${CONTAINER_resizable_WIDTH}px`,
                }}
                onMouseDown={handleMouseDown}
            >
                <div className="absolute top-1/2 left-1/2 w-13 h-[2px] bg-black opacity-0 group-hover:opacity-100 transition-opacity duration-200 -translate-x-1/2 -translate-y-1/2 rounded-full" />
            </div>

            <div
                id='chat-container'
                className="flex-grow bg-[#fefefe]"
                style={{ height: `${bottomHeight}px` }}>
                <ChatComments lines={lines} bottomHeight={bottomHeight} chatFunctions={chatFunctions} />
            </div>
        </div>
    );
}
