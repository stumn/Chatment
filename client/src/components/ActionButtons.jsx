// File: my-react-app/src/components/ActionButtons.jsx

import React from 'react';

/**
 * DocRowのアクションボタン群を管理するコンポーネント
 * @param {Object} props - プロパティ
 * @param {boolean} props.isEditing - 編集中かどうか
 * @param {boolean} props.isBlank - 空白行かどうか
 * @param {Function} props.onEdit - 編集ボタンクリック時のハンドラー
 * @param {Function} props.onCompleteEdit - 編集完了ボタンクリック時のハンドラー
 * @param {Function} props.onDelete - 削除ボタンクリック時のハンドラー
 * @param {Function} props.onAddBelow - 下に行追加ボタンクリック時のハンドラー
 */
const ActionButtons = ({
    isEditing,
    isBlank,
    onEdit,
    onCompleteEdit,
    onDelete,
    onAddBelow
}) => {
    return (
        <>
            {isEditing ? (
                // 編集中の場合は編集完了ボタンのみ表示
                <button
                    className="complete-edit-button p-1 ml-1 bg-white text-gray-400 hover:text-green-600 hover:bg-gray-200 rounded-full shadow-md border"
                    title="編集完了 (Ctrl+Enter)"
                    onClick={onCompleteEdit}
                    tabIndex={-1}
                    type="button"
                >
                    {/* チェックマークアイコン */}
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                </button>
            ) : (
                // 通常時は編集・削除・追加ボタンを表示
                <>
                    {/* 編集ボタン */}
                    <button
                        className="edit-button p-1 ml-1 bg-white text-gray-400 hover:text-green-600 hover:bg-gray-200 rounded-full shadow-md border"
                        title="編集"
                        onClick={onEdit}
                        tabIndex={-1}
                        type="button"
                    >
                        {/* 鉛筆アイコン */}
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                    </button>

                    {/* 削除ボタン（空白行の場合のみ表示） */}
                    {isBlank && (
                        <button
                            className="delete-button p-1 ml-1 bg-white text-gray-400 hover:text-red-500 hover:bg-gray-200 rounded-full shadow-md border"
                            title="空白行を削除"
                            onClick={onDelete}
                            tabIndex={-1}
                            type="button"
                        >
                            {/* ゴミ箱アイコン */}
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            >
                                <path d="M3 6h18" />
                                <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
                                <path d="M19 6l-1.5 14a2 2 0 0 1-2 2H8.5a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                            </svg>
                        </button>
                    )}

                    {/* 下に行追加ボタン */}
                    <button
                        className="add-button p-1 bg-white text-gray-400 hover:text-blue-500 hover:bg-gray-200 rounded-full shadow-md border"
                        title="下に行を挿入"
                        onClick={onAddBelow}
                        tabIndex={-1}
                        type="button"
                    >
                        {/* プラスアイコン */}
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M12 5v14m-7-7h14" />
                        </svg>
                    </button>
                </>
            )}
        </>
    );
};

export default ActionButtons;
