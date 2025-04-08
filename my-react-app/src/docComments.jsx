import React, { use, useState } from 'react';

const DocComments = ({ docMessages = [], onChangeDoc }) => {

    const handleDragStart = (e, index) => {
        console.log('ドラッグ開始:', index);
        e.dataTransfer.setData('text/plain', index);
    };

    const handleDragEnd = (e) => {
        console.log('ドラッグ終了');
    };

    const handleDragOver = (e, overIndex) => {
        e.preventDefault();
        // ドラッグ中の処理を実装
        const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (dragIndex === overIndex) return; // 同じ場所なら何もしない
        // overIndex の要素をハイライトする
        // e.target.style.backgroundColor = 'lightgray';
        e.target.style.borderBottom = '3px solid lightgray';
        console.log('ドラッグオーバー:', overIndex);
    };

    const handleDragLeave = (e) => {
        // ドラッグ離れたときの処理を実装
        // e.target.style.backgroundColor = '';
        e.target.style.borderBottom = '';
        console.log('ドラッグリーブ');
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        console.log('ドロップ先:', dropIndex, 'ドラッグ元:', dragIndex);

        if (dragIndex === dropIndex) return; // 同じ場所なら何もしない

        // e.target.style.backgroundColor = '';
        e.target.style.borderBottom = '';

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

    // contentEditable のイベントハンドラ
    const handleEdit = (e) => {
        // edit された要素を取得
        // edit された　＝変更内容を取得
        // 配列のコピーを作成
        // 配列の変更部分を変更
        // userState は今の状況だけ　DBに編集履歴を残す
        // onChangeDoc();
    }

    const className = "doc-message" + " latest";

    return (
        <ul className="chat-window"
            style={{ overflowY: 'auto', height: '100%' }}>
            {docMessages.map((message, index) => (
                <li
                    id={index}
                    key={index}
                    className={className}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    contentEditable={true}
                >
                    {message.message}
                </li>
            ))}
        </ul>
    );
};

export default DocComments;
