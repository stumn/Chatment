// File: client/src/components/sidebar/SidebarContent.jsx

import React from 'react';

/**
 * サイドバーのメインコンテンツ部分（チャプターと注目コメント）
 * @param {Object} props - プロパティ
 * @param {Array} props.tocData - 目次データ（チャプターと注目コメントのリスト）
 * @param {boolean} props.isColorfulMode - カラフルモードの状態
 * @param {Function} props.onItemClick - 項目クリック時のハンドラ
 */
const SidebarContent = ({ tocData, isColorfulMode, onItemClick }) => {
    return (
        <div className="sb-scrollable-content">
            {/* チャプターと注目コメントセクション */}
            <div className="sb-chapter-section">
                {/* タイトル部分 - 固定 */}
                <div className="sb-section-header sidebar-text">
                    <svg xmlns="http://www.w3.org/2000/svg" className="sb-section-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                        <h2 className="sb-section-title">チャプターと注目コメント</h2>
                    </div>
                </div>

                {/* スクロール可能なリスト部分 */}
                <div className="sb-chapter-list sidebar-text">
                    <div className="sb-items-container">
                        {tocData.length === 0
                            ? (
                                <div className="sb-empty-message">
                                    見出しや注目コメントがありません
                                </div>
                            )
                            : (
                                tocData.map(section => (
                                    <div key={section.id} className="sb-section">
                                        {/* 見出し */}
                                        <button
                                            onClick={() => onItemClick(section.id)}
                                            className={`sb-heading-button ${isColorfulMode ? 'colorful-mode' : ''}`}
                                        >
                                            {section.msg.replace(/^#+\s*/, '')}
                                        </button>

                                        {/* ネストされた注目コメント */}
                                        {section.comments.length > 0 && (
                                            section.comments.map(comment => (
                                                <button
                                                    key={comment.id}
                                                    onClick={() => onItemClick(comment.id)}
                                                    className="sb-comment-button"
                                                >
                                                    <div className="sb-comment-text">
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