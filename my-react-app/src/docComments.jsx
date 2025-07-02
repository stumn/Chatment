// // File: my-react-app/src/docComments.jsx

// TODO: ドキュメント編集・追加・並び替えのsocket通信・DB保存・他クライアント反映は未実装
// TODO: emitDocAdd, emitDocEdit, emitDocReorderのpayload構造がサーバと一致しているか要確認
// TODO: DB保存や他クライアント反映の責務分離に注意

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';

import './Doc.css';
import DocRow from './DocRow'; // ←遅延読み込みをやめて通常import

import useChatStore from './store/chatStore';
import useSizeStore from './store/sizeStore';
import useAppStore from './store/appStore';
import useSocket from './store/useSocket';
import useDocStore from './store/docStore';

const DocComments = ({ lines, emitChatMessage }) => {

    const listRef = useRef(null);

    // --- 新規行追加時の自動スクロール抑制用 ---
    const [shouldScroll, setShouldScroll] = useState(true);

    const messages = useChatStore((state) => state.messages);
    const updateMessage = useChatStore((state) => state.updateMessage);
    const reorderMessages = useChatStore((state) => state.reorderMessages);
    
    const { emitDocReorder } = useSocket();

    const { userInfo, myHeight } = useAppStore();

    const listWidth = Math.floor(useSizeStore((state) => state.width) * 0.8);
    const charsPerLine = Math.floor(listWidth / 13);

    // 表示するdocMessagesを決定
    const docMessages = useDocStore((state) => state.docMessages);
    const setDocMessages = useDocStore((state) => state.setDocMessages);
    const updateDocMessage = useDocStore((state) => state.updateDocMessage);
    const reorderDocMessages = useDocStore((state) => state.reorderDocMessages);
    const addDocMessage = useDocStore((state) => state.addDocMessage);

    // サーバから取得したらsetDocMessagesでセットする（useEffect等で）

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
        const lines = msg.split('\n').length;
        // 1行ごとの文字数で折り返し行数を推定
        const charCount = msg.length;
        const charsPerLine = Math.floor(listWidth / 13);
        const estimatedLines = Math.max(
            lines,
            ...msg.split('\n').map(line => Math.ceil(line.length / charsPerLine) || 1)
        );
        return estimatedLines * lineHeight + 8;
    };

    // DnDのonDragEnd
    const onDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination || source.index === destination.index) return;
        // 並び替え先の前後displayOrderを取得し新しいdisplayOrderを計算
        const before = docMessages[destination.index - 1]?.displayOrder;
        const after = docMessages[destination.index]?.displayOrder;
        let newDisplayOrder;
        if (before !== undefined && after !== undefined) {
            newDisplayOrder = (before + after) / 2;
        } else if (before !== undefined) {
            newDisplayOrder = before + 1;
        } else if (after !== undefined) {
            newDisplayOrder = after / 2;
        } else {
            newDisplayOrder = 1;
        }
        reorderDocMessages(docMessages[source.index].id, newDisplayOrder);
        emitDocReorder && emitDocReorder({ id: docMessages[source.index].id, newDisplayOrder });
        if (listRef.current) {
            listRef.current.resetAfterIndex(0, true);
        }
    };

    // Listに渡すitemData
    const itemData = useMemo(() => ({
        docMessages,
        userInfo,
        emitChatMessage,
        setShouldScroll,
        listRef,
        addDocMessage,
        updateDocMessage,
    }), [docMessages, userInfo, emitChatMessage]);

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
                            itemCount={docMessages.length}
                            itemSize={getItemSize}
                            outerRef={provided.innerRef}
                            itemData={itemData}
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
