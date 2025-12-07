// File: client/src/ChatApp.jsx

import { useEffect, Suspense, lazy, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAppController } from '../hooks/spaces/useAppController';

import useAppStore from '../store/spaces/appStore';
import useSizeStore from '../store/shared/sizeStore';
import useSocket from '../hooks/shared/useSocket';

import useResponsiveSize from '../hooks/shared/useResponsiveSize';

import BeforeLogin from "../components/spaces/BeforeLogin";
const AfterLogin = lazy(() => import('../components/spaces/AfterLogin'));

function ChatApp() {
    // URLパラメータからspaceIdを取得
    const { spaceId } = useParams();

    // --- 状態管理フックを先に記述 ---
    const [open, setOpen] = useState(true);

    // --- カスタムフック ---
    useResponsiveSize();

    // ストアからの状態取得
    const { width, height } = useSizeStore();
    const { userInfo, setUserInfo, myHeight, setMyHeight, setSpaceName } = useAppStore();

    // useAppControllerを使用してSocket通信を一元管理
    const appController = useAppController();
    const { socket: { heightArray }, raw: socketFunctions } = appController;

    // ログイン状態を判定する変数を定義
    const isLoggedIn = userInfo.nickname !== undefined;

    // spaceIdが変更されたらスペース情報を取得
    useEffect(() => {
        if (!spaceId) return;

        const fetchSpaceInfo = async () => {
            try {
                const response = await fetch(`/api/spaces/${spaceId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.space) {
                        setSpaceName(data.space.name);
                    }
                } else {
                    console.error('スペース情報の取得に失敗しました');
                }
            } catch (error) {
                console.error('スペース情報の取得エラー:', error);
            }
        };

        fetchSpaceInfo();
    }, [spaceId, setSpaceName]);

    useEffect(() => {
        if (!isLoggedIn) return;

        // spaceIdはuserInfoに含まれているため、emitLoginNameで送信される
        socketFunctions.emitLoginName(userInfo);

        setOpen(false);
    }, [userInfo, isLoggedIn, spaceId]); // spaceIdを依存配列に追加

    /**
     * [Architectural Note]
     * Room joining logic was previously handled here, but has been refactored for better separation of concerns.
     * Room joining is now managed automatically in useRoomHandlers.js, which listens for the "room-list" event
     * from the server and joins the first available room upon receiving it.
     *
     * Lifecycle:
     * - After login, socket communication is established and user info is sent.
     * - useRoomHandlers.js (hooked elsewhere in the app) listens for "room-list" events.
     * - When "room-list" is received, useRoomHandlers.js automatically joins the first room.
     * - This ensures that room joining is decoupled from the ChatApp component and handled in a centralized place.
     *
     * If you need to modify room joining behavior, refer to useRoomHandlers.js for the current implementation.
     */

    // myHeightが変更されたらサーバーに高さを送信
    useEffect(() => {
        socketFunctions.emitHeightChange(myHeight);
    }, [myHeight]);

    if (isLoggedIn) { // ログイン完了後
        return (
            <>
                <title>Chatment</title>
                <Suspense fallback={<div>Loading...</div>}>
                    <AfterLogin
                        heightArray={heightArray}
                        appController={appController}
                        userInfo={userInfo}
                        spaceId={spaceId}
                    />
                </Suspense>
            </>
        );
    } else { // ログイン前
        return (
            <>
                <title>Chatment | ログイン</title>
                <Suspense fallback={<div>Loading...</div>}>
                    <BeforeLogin open={open} onLogin={setUserInfo} spaceId={spaceId} />
                </Suspense>
            </>
        );
    }
}

export default ChatApp;
