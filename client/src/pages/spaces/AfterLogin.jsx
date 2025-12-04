// File: client/src/AfterLogin.jsx

import { useState, useCallback } from 'react';
import ResizablePanels from '../../components/spaces/ResizablePanels'
import InputForm from '../../components/spaces/InputForm'
import Telomere from '../../components/spaces/Telomere';
import Sidebar from '../../components/spaces/Sidebar';

import sizeStore from '../../store/shared/sizeStore';
import useAppStore from '../../store/spaces/appStore';

export default function AfterLogin({ heightArray, appController, userInfo, spaceId = null }) {
    // userInfoとspaceIdをpropsから受け取る
    // TODO: spaceIdに基づいてスペース固有のUI要素を表示
    // TODO: スペース権限に応じた機能制限の実装
    const { nickname, status, ageGroup, userId } = userInfo;

    // サイドバーの状態管理
    const { isTocOpen, toggleToc } = useAppStore();

    // スクロール関数を保持するための状態
    const [scrollToItemById, setScrollToItemById] = useState(null);

    // setScrollToItemByIdをメモ化して再生成を防ぐ
    const handleScrollToItem = useCallback((scrollFunc) => {
        setScrollToItemById(() => scrollFunc);
    }, []);

    // after-login-containerの幅・高さを設定(sizeStore から取得)
    const CONTAINER_1_WIDTH = sizeStore((state) => state.width);
    const CONTAINER_1_HEIGHT = sizeStore((state) => state.height);

    // resizable-containerの幅・高さを設定(計算)
    const CONTAINER_2_WIDTH = CONTAINER_1_WIDTH; // 100%の幅
    const CONTAINER_2_HEIGHT = CONTAINER_1_HEIGHT * 0.82; //82%の高さ

    // 目次が開いている場合のレイアウト調整
    const tocOffset = isTocOpen ? 80 : 0; // 目次の幅分オフセット

    // heightArray のうち、spaceId が一致するもののみ残す
    // console.log("AfterLogin heightArray:", heightArray);
    const filteredHeightArray = heightArray.filter(item => item.spaceId === spaceId);

    return (
        <div
            id="after-login-container"
            style={{
                paddingTop: '1.5rem',
                paddingBottom: '1.5rem',
                width: `${CONTAINER_1_WIDTH}px`,
                height: `${CONTAINER_1_HEIGHT}px`,
                marginLeft: `${tocOffset}px`, // 目次が開いている場合は右にシフト
                transition: 'margin-left 0.3s ease' // スムーズな移動
            }}>

            <Sidebar isOpen={isTocOpen} onToggle={toggleToc} userInfo={userInfo} spaceId={spaceId} scrollToItemById={scrollToItemById} />

            <div
                id="resizable-container"
                style={{
                    width: `${CONTAINER_2_WIDTH - tocOffset}px`, // 目次の幅分を引く
                    height: `${CONTAINER_2_HEIGHT}px`,
                    display: 'flex',
                    flexDirection: 'row', // Change to row for horizontal layout
                    alignItems: 'flex-start', // Align items at the top
                    gap: '4px', // Add spacing between elements
                    transition: 'width 0.3s ease' // スムーズな幅変更
                }}>

                <ResizablePanels appController={appController} spaceId={spaceId} onScrollToItem={handleScrollToItem} />

                <Telomere heightArray={filteredHeightArray} CONTAINER_HEIGHT={CONTAINER_2_HEIGHT} />

            </div>

            <InputForm nickname={nickname} status={status} ageGroup={ageGroup} userId={userId} appController={appController} />
        </div>
    );
}