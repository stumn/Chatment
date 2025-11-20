// File: client/src/components/sidebar/SidebarContent.jsx

import React from 'react';
import { useParams } from 'react-router-dom';

/**
 * サイドバーのメインコンテンツ部分（チャプターと注目コメント）
 * @param {Object} props - プロパティ
 * @param {Array} props.tocData - 目次データ（チャプターと注目コメントのリスト）
 * @param {boolean} props.isColorfulMode - カラフルモードの状態
 * @param {Function} props.onItemClick - 項目クリック時のハンドラ
 */
const SidebarContent = ({ tocData, isColorfulMode, onItemClick }) => {
    const { spaceId } = useParams();
    const documentId = 0;

    const openDocumentWindow = () => {
        // 新しいタブでドキュメントページを開く（React Routerを使用）
        const documentUrl = `/document/${spaceId}/${documentId}`;
        window.open(documentUrl, '_blank');
    };

    return (
        <div className="flex-1 px-6 overflow-hidden min-h-0 flex flex-col">
            {/* チャプターと注目コメントセクション */}
            <div className="flex flex-col h-full flex-1">
                {/* タイトル部分 - 固定 */}
                <div className="flex items-center mb-4 flex-shrink-0 bg-gray-100 pb-2 border-b border-gray-200 sidebar-text">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">チャプター（見出しと注目コメント）</h2>
                    </div>
                </div>

                {/* スクロール可能なリスト部分 */}
                <div className="flex-1 overflow-y-auto min-h-0 pt-2 sidebar-text">
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => openDocumentWindow()}
                            className={`w-full text-left p-3 bg-transparent border-none rounded-lg cursor-pointer text-sm font-normal text-gray-700 transition-all duration-200 font-inherit hover:bg-gray-200 sb-heading-button ${isColorfulMode ? 'colorful-mode' : ''}`}
                        >
                            全編の振り返り
                        </button>
                        {tocData.length === 0
                            ? (
                                <div className="text-gray-400 text-sm p-3">
                                    見出しや注目コメントがありません
                                </div>
                            )
                            : (
                                tocData.map(section => (
                                    <div key={section.id} className="flex flex-col gap-2">
                                        {/* 見出し */}
                                        <button
                                            onClick={() => onItemClick(section.id)}
                                            className={`w-full text-left p-3 bg-transparent border-none rounded-lg cursor-pointer text-sm font-normal text-gray-700 transition-all duration-200 font-inherit hover:bg-gray-200 sb-heading-button ${isColorfulMode ? 'colorful-mode' : ''}`}
                                        >
                                            {section.msg.replace(/^#+\s*/, '')}
                                        </button>

                                        {/* ネストされた注目コメント */}
                                        {section.comments.length > 0 && (
                                            section.comments.map(comment => (
                                                <button
                                                    key={comment.id}
                                                    onClick={() => onItemClick(comment.id)}
                                                    className="w-full text-left p-3 bg-transparent border-none rounded-lg cursor-pointer text-sm text-gray-700 transition-all duration-200 ml-4 font-inherit hover:bg-gray-200"
                                                >
                                                    <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                                        {comment.msg}
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                ))
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SidebarContent;