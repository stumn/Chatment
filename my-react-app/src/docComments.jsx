// // File: my-react-app/src/docComments.jsx

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';

import './Doc.css';
import DocRow from './DocRow'; // ←遅延読み込みをやめて通常import

import useSizeStore from './store/sizeStore';
import useAppStore from './store/appStore';
import useSocket from './store/useSocket';
import usePostStore from './store/postStore';

const DocComments = ({ lines, emitChatMessage }) => {

    const listRef = useRef(null);

    // --- 新規行追加時の自動スクロール抑制用 ---
    const [shouldScroll, setShouldScroll] = useState(true);

    // const messages = useChatStore((state) => state.messages);
    // const updateMessage = useChatStore((state) => state.updateMessage);
    // const reorderMessages = useChatStore((state) => state.reorderMessages);
    // const docMessages = useDocStore((state) => state.docMessages);
    // const setDocMessages = useDocStore((state) => state.setDocMessages);
    // const updateDocMessage = useDocStore((state) => state.updateDocMessage);
    // const reorderDocMessages = useDocStore((state) => state.reorderDocMessages);
    // const addDocMessage = useDocStore((state) => state.addDocMessage);
    // --- 無限ループ・update depth exceeded 問題の修正 ---
    // 課題: usePostStore((state) => state.getDocMessages()) のように、zustandのセレクタで毎回新しい配列を返すと、
    // Reactの再レンダリングが無限ループになることがある。
    // 理由: getDocMessages()は新しい配列を返すため、useEffectやuseMemoの依存配列が毎回変化し、
    //       Reactが再レンダリング→zustandが新配列→再レンダリング...となる。
    // 解決: getDocMessages()の呼び出しをuseMemoでラップし、posts配列が変化したときだけ再計算する。
    const posts = usePostStore((state) => state.posts);
    const docMessages = useMemo(() => {
        // getDocMessages()のロジックをここに移植
        return [...posts].sort((a, b) => a.displayOrder - b.displayOrder);
    }, [posts]);
    const updateDocMessage = usePostStore((state) => state.updatePost);
    const reorderDocMessages = usePostStore((state) => state.reorderPost);
    const addDocMessage = usePostStore((state) => state.addPost);

    const { emitDocReorder } = useSocket();

    const { userInfo, myHeight } = useAppStore();

    const listWidth = Math.floor(useSizeStore((state) => state.width) * 0.8);
    const charsPerLine = Math.floor(listWidth / 13);

    // スクロールを最下部に（shouldScrollがtrueのときのみ）
    useEffect(() => {
        if (shouldScroll && listRef.current) {
            listRef.current.scrollToItem(docMessages.length - 1, 'end');
        }
    }, [myHeight, lines.num, docMessages.length, shouldScroll]);

    // 各行の高さを計算（改行や長文も考慮）
    const getItemSize = (index) => {
        const lineHeight = 28;
        if (!docMessages[index] || !docMessages[index].msg) return lineHeight + 16;
        // 改行数をカウント
        const msg = docMessages[index].msg;
        const itemLines = msg.split('\n').length;
        // 1行ごとの文字数で折り返し行数を推定
        const charCount = msg.length;
        const charsPerLine = Math.floor(listWidth / 13);
        const estimatedLines = Math.max(
            itemLines,
            ...msg.split('\n').map(line => Math.ceil(line.length / charsPerLine) || 1)
        );
        return estimatedLines * lineHeight + 8;
    };

    // DnDのonDragEnd
    const onDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination || source.index === destination.index) return;

        console.log('onDragEnd:', source, destination);

        // 並び替え先の前後displayOrderを取得し新しいdisplayOrderを計算
        // **この計算はサーバーサイドで行うべきなので、ここでは送信する情報に留める**
        const movedPostDisplayOrder = docMessages[source.index].displayOrder;
        const beforePostDisplayOrder = docMessages[destination.index - 1]?.displayOrder;
        const afterPostDisplayOrder = docMessages[destination.index]?.displayOrder;

        const data = {
            nickname: userInfo.nickname + `(${userInfo.status}+${userInfo.ageGroup})` || 'Unknown',
            movedPostId: docMessages[source.index].id,
            movedPostDisplayOrder: movedPostDisplayOrder,
            beforePostDisplayOrder: beforePostDisplayOrder,
            afterPostDisplayOrder: afterPostDisplayOrder
        }
        console.log('onDragEnd data:', data)

        // サーバーに並び替えを通知
        emitDocReorder && emitDocReorder(data);
        
        if (listRef.current) {
            listRef.current.resetAfterIndex(0, true);
        }
    };

    // idがundefinedなものを除外し、重複idも除外
    const filteredDocMessages = useMemo(() => docMessages.filter((msg, idx, arr) => msg && msg.id !== undefined && arr.findIndex(m => m.id === msg.id) === idx), [docMessages]);
    const docCount = filteredDocMessages.length;

    // Listに渡すitemData
    const itemData = useMemo(() => ({
        docMessages: filteredDocMessages,
        userInfo,
        emitChatMessage,
        setShouldScroll,
        listRef,
        addDocMessage,
        updateDocMessage,
    }), [filteredDocMessages, userInfo, emitChatMessage]);

    // ListのitemRenderer
    const renderRow = ({ index, style, data }) => (
        <DocRow
            data={data}
            index={index}
            style={style}
        />
    );

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable
                droppableId="droppable"
                mode="virtual"
                direction="vertical"
                renderClone={(provided, snapshot, rubric) => (
                    // ドラッグ中のアイテムのクローン
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className='is-dragging'
                    >
                        <DocRow
                            data={itemData}
                            index={rubric.source.index}
                            style={provided.draggableProps.style}
                        />
                    </div>
                )}
            >
                {(provided) => (
                    <div style={{ width: '100%' }}>
                        <List
                            id="docList"
                            ref={listRef}
                            height={myHeight}
                            itemCount={docCount}
                            itemSize={getItemSize}
                            outerRef={provided.innerRef}
                            itemData={itemData}
                            itemKey={index => index}
                        >
                            {renderRow}
                        </List>
                        {/* DnDのためのplaceholderを必ず描画 */}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
};

export default DocComments;
