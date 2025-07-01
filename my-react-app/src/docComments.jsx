// // File: my-react-app/src/docComments.jsx

import React, { useEffect, useState, useRef, useMemo } from 'react';

import { VariableSizeList as List } from 'react-window';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';

import './Doc.css'; // スタイルシート
const DocRow = React.lazy(() => import('./DocRow')); // DocRowを遅延読み込み

import useChatStore from './store/chatStore';
import useSizeStore from './store/sizeStore';
import useAppStore from './store/appStore';

// ★追加: ドラッグ中のスタイルをY軸方向に固定するためのヘルパー関数
// transform スタイルから Y軸の値だけを抽出し、X軸の値を0に固定します。
const getVerticalDragStyle = (style) => {
    if (style?.transform) {
        const transform = style.transform;
        const y = transform.substring(transform.indexOf(',') + 1, transform.indexOf(')'));
        return {
            ...style,
            transform: `translate(0, ${y})`,
        };
    }
    return style;
};

const DocComments = ({ lines, emitChatMessage }) => {

    const listRef = useRef(null);  // Listコンポーネントに使うref

    const messages = useChatStore((state) => state.messages);
    const updateMessage = useChatStore((state) => state.updateMessage);
    const reorderMessages = useChatStore((state) => state.reorderMessages);

    const { userInfo, myHeight } = useAppStore();

    const docMessages = useMemo(() => {
        if (!messages || messages.length === 0) {
            return [];
        }
        return messages.slice(0, Math.max(0, messages.length - lines.num));
    }, [messages, lines.num]);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollToItem(docMessages.length - 1, "end"); // 最下部にスクロール
        }
    }, [myHeight, lines.num, docMessages.length]);

    const listWidth = Math.floor(useSizeStore((state) => state.width) * 0.8); // 80%の幅を使用
    const charsPerLine = Math.floor(listWidth / 13); // 1行あたりの文字数を計算(幅px / 13px)

    const getItemSize = (index) => {
        const lineHeight = 28; // 1行あたりの高さを28pxに設定
        if (!docMessages || !docMessages[index] || !docMessages[index].msg) {
            return lineHeight + 16;
        }
        const charCount = docMessages[index].msg.length;
        const estimatedLines = Math.ceil(charCount / charsPerLine); // 計算した文字数で行数を計算
        return estimatedLines * lineHeight; // 必要な行数分の高さを返す
    };

    // ★追加: ドロップ先のインデックスとドラッグ元のインデックスを管理するstate
    const [dropTargetInfo, setDropTargetInfo] = useState({
        targetIndex: null,
        sourceIndex: null,
    });

    const onDragStart = (start) => {
        // ドラッグ開始時に元の位置をセット
        setDropTargetInfo({
            targetIndex: start.source.index,
            sourceIndex: start.source.index,
        });
    };

    const onDragUpdate = (update) => {
        // ドラッグ中にドロップ先の位置を更新
        if (!update.destination) {
            setDropTargetInfo(prev => ({ ...prev, targetIndex: null }));
            return;
        }
        setDropTargetInfo(prev => ({ ...prev, targetIndex: update.destination.index }));
    };

    const onDragEnd = (result) => {
        const { source, destination } = result;

        setDropTargetInfo({ targetIndex: null, sourceIndex: null });
        if (!destination || source.index === destination.index) return;
        reorderMessages(source.index, destination.index);
    };

    // ★変更: itemDataにdropTargetInfoを追加
    const itemData = useMemo(() => ({
        docMessages,
        userInfo,
        emitChatMessage,
        dropTargetInfo, // 渡す
    }), [docMessages, userInfo, emitChatMessage, dropTargetInfo]);

    return (
        <DragDropContext
            onDragStart={onDragStart}
            onDragUpdate={onDragUpdate}
            onDragEnd={onDragEnd}
        >
            <Droppable
                droppableId="droppable"
                mode="virtual"
                direction="vertical"
                renderClone={(provided, snapshot, rubric) => {
                    const style = getVerticalDragStyle(provided.draggableProps.style);

                    // ★変更: 画像のようにドラッグ中のスタイルを調整
                    if (snapshot.isDragging) {
                        style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                        style.background = 'white'; // 背景色を強制
                    }

                    return (
                        <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className='is-dragging'
                        >
                            <DocRow
                                data={itemData}
                                index={rubric.source.index}
                                style={style}
                            />

                        </div>
                    );
                }}
            >
                {(provided) => (
                    <List
                        id="docList"
                        ref={listRef}  // ここでListにrefを適用
                        height={myHeight}
                        itemCount={docMessages.length}
                        itemSize={getItemSize}
                        width="100%"
                        outerRef={provided.innerRef}
                        itemData={itemData} // useMemoで作成したitemDataを渡す
                    >
                        {DocRow}
                    </List>
                )}
            </Droppable>
        </DragDropContext >
    );
};

export default DocComments;
