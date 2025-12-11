// // File: client/src/DocComments.jsx 

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';

import './Doc.css';
import DocRow from './DocRow';

import useSizeStore from '../../../store/sizeStore';
import useAppStore from '../../../store/spaces/appStore';
import usePostStore from '../../../store/spaces/postStore';

const DocComments = ({ lines, documentFunctions, onScrollToItem }) => {

    const listRef = useRef(null);

    // 変更状態管理のメソッドを取得
    const clearOldChangeStates = usePostStore((state) => state.clearOldChangeStates);

    // ドキュメントの投稿を取得(後ろからlines分は取り除く)
    const posts = usePostStore((state) => state.posts);

    const docMessages = useMemo(() => {
        let docPosts = posts.slice(0, -lines.num); // 後ろからlines.num分を除外
        docPosts = [...docPosts].sort((a, b) => a.displayOrder - b.displayOrder);
        return docPosts;
    }, [posts, lines.num]);

    // documentFunctionsから必要な関数を取得
    const { document: { reorder }, chat: sendChatMessage } = documentFunctions;

    const { userInfo, myHeight } = useAppStore();

    const listWidth = Math.floor(useSizeStore((state) => state.width) * 0.8);
    const charsPerLine = Math.floor(listWidth / 13);

    // 定期的に古い変更状態をクリア（10分経過したもの）
    useEffect(() => {
        const interval = setInterval(() => {
            clearOldChangeStates(10); // 10分経過した変更状態をクリア（フェードアウト時間に合わせて調整）
        }, 60000); // 1分ごとにチェック

        return () => clearInterval(interval);
    }, [clearOldChangeStates]);

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

    // ドラッグ開始時のロック要求
    const onDragStart = (start) => {
        console.log('onDragStart:', start);

        const draggedMessage = docMessages[start.source.index];
        if (draggedMessage && draggedMessage.id) {
            const rowElementId = `dc-${start.source.index}-${draggedMessage.displayOrder}-${draggedMessage.id}`;

            // ドラッグ開始時にロックを要求
            documentFunctions.document.requestLock(rowElementId, userInfo.nickname, userInfo._id);
        }
    };

    // DnDのonDragEnd
    const onDragEnd = (result) => {
        const { source, destination } = result;

        // ドラッグされた行の情報を取得
        const draggedMessage = docMessages[source.index];
        const rowElementId = `dc-${source.index}-${draggedMessage?.displayOrder}-${draggedMessage?.id}`;

        // ドラッグが中断された場合（destination が null）はロック解除のみ
        if (!destination) {
            console.log('Drag cancelled, unlocking row:', rowElementId);
            documentFunctions.document.unlockRow({ rowElementId, postId: draggedMessage?.id });
            return;
        }

        // 同じ位置にドロップされた場合もロック解除のみ
        if (source.index === destination.index) {
            console.log('Drag to same position, unlocking row:', rowElementId);
            documentFunctions.document.unlockRow({ rowElementId, postId: draggedMessage?.id });
            return;
        }

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
            prev: beforePostDisplayOrder,
            next: afterPostDisplayOrder
        }
        console.log('onDragEnd data:', data)


        // サーバーに並び替えを通知
        reorder && reorder(data);

        // ドラッグ完了後にロック解除
        console.log('Drag completed successfully, unlocking row:', rowElementId);
        documentFunctions.document.unlockRow({ rowElementId, postId: draggedMessage?.id });

        if (listRef.current) {
            listRef.current.resetAfterIndex(0, true);
        }
    };

    // idがundefinedなものを除外し、重複idも除外
    const filteredDocMessages = useMemo(() =>
        docMessages.filter((msg, idx, arr) =>
            msg && msg.id !== undefined && arr.findIndex(m => m.id === msg.id) === idx)
        , [docMessages]);

    const docCount = filteredDocMessages.length;

    // スクロール関数を親コンポーネントに公開
    useEffect(() => {
        if (!onScrollToItem) return;

        const scrollToItemById = (postId) => {
            if (!listRef.current) {
                console.warn('List ref is not ready yet');
                return;
            }

            const targetIndex = filteredDocMessages.findIndex(msg => msg.id === postId);
            if (targetIndex !== -1) {
                listRef.current.scrollToItem(targetIndex, "center");
                console.log(`Scrolled to post ${postId} at index ${targetIndex}`);
            } else {
                console.warn(`Post ${postId} not found in filteredDocMessages`);
            }
        };

        onScrollToItem(scrollToItemById);
    }, [filteredDocMessages, onScrollToItem]);

    // Listに渡すitemData
    const itemData = useMemo(() => ({
        docMessages: filteredDocMessages,
        userInfo,
        documentFunctions,
        listRef,
    }), [filteredDocMessages, userInfo, documentFunctions]);

    // ListのitemRenderer
    const renderRow = ({ index, style, data }) => (
        <DocRow
            data={data}
            index={index}
            style={style}
        />
    );

    return (
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
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
