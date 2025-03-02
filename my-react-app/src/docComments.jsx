import React, { use, useState } from 'react';

const DocComments = ({ docMessages = [], onChangeDoc}) => {

    // イベントハンドラを定義
    const handleDragStart = (e, index) => {
        // ドラッグ開始時の処理を実装
        console.log('ドラッグ開始:', index);
        e.dataTransfer.setData('text/plain', index);
    };

    const handleDragEnd = (e) => {
        // ドラッグ終了時の処理を実装
        console.log('ドラッグ終了');
    };

    const handleDragOver = (e, index) => {
        e.preventDefault(); // ドロップを許可するためにデフォルト動作をキャンセル
        // ドラッグ中の処理を実装
        console.log('ドラッグオーバー:', index);
    };

    const handleDragLeave = (e) => {
        // ドラッグ離れたときの処理を実装
        console.log('ドラッグリーブ');
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        console.log('ドロップ先:', dropIndex, 'ドラッグ元:', dragIndex);

        if (dragIndex === dropIndex) return; // 同じ場所なら何もしない

        // 配列のコピーを作成して操作
        const newDocMessages = [...docMessages];
        // ドラッグ元の要素を削除（削除した要素を取得）
        const [draggedItem] = newDocMessages.splice(dragIndex, 1);

        // ドロップ先がドラッグ元の後ろにある場合、削除でインデックスがずれるので調整
        if (dragIndex < dropIndex) {
            // ドロップ先の位置は削除後、1つ前にずれるのでそのまま挿入すると「後」に配置できる
            newDocMessages.splice(dropIndex, 0, draggedItem);
        } else {
            // ドラッグ元がドロップ先より後ろの場合は、ドロップ先の次に挿入する
            newDocMessages.splice(dropIndex + 1, 0, draggedItem);
        }

        onChangeDoc(newDocMessages);
    };

    return (
        <ul className="chat-window"
            style={{overflowY: 'auto', height: '100%' }}>
            {docMessages.map((message, index) => (
                <li
                    id={index}
                    key={index}
                    className="doc-message"
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                >
                    <span
                        contentEditable={true}
                    >
                        {message}
                    </span>

                </li>
            ))}
        </ul>
    );
};

export default DocComments;
