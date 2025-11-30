import React from 'react';

/**
 * ドキュメントページのヘッダーコンポーネント
 * 
 * 機能:
 * - スペース情報の表示
 * - 投稿数、最終投稿日時、終了日時の表示
 * - 再読み込み・閉じるボタン
 * - セクション情報の表示
 */
const DocumentHeader = ({
    spaceData,
    currentSpaceId,
    docId,
    posts,
    isLoading,
    onRefresh,
    onClose
}) => {
    return (
        <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="px-3 py-2 flex justify-between items-center">
                <SpaceInfo
                    spaceData={spaceData}
                    currentSpaceId={currentSpaceId}
                    docId={docId}
                    posts={posts}
                    isLoading={isLoading}
                />
                <ActionButtons
                    isLoading={isLoading}
                    onRefresh={onRefresh}
                    onClose={onClose}
                />
            </div>
        </div>
    );
};

/**
 * スペース情報表示コンポーネント
 */
const SpaceInfo = ({ spaceData, currentSpaceId, docId, posts, isLoading }) => {
    return (
        <div className="flex-1 flex items-center gap-3 text-sm">
            {/* スペース名 */}
            <span className="font-semibold text-gray-800">
                {spaceData ? spaceData.name : `スペース ${currentSpaceId}`}
            </span>

            {/* メタ情報を1行に */}
            <span className="text-gray-500">
                {isLoading ? '読み込み中...' : `${posts.length}件`}
                {docId && parseInt(docId) > 0 && ` | セクション: ${docId}`}
                {spaceData?.lastActivity && ` | ${new Date(spaceData.lastActivity).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`}
                {spaceData?.finishedAt && ` | 終了: ${new Date(spaceData.finishedAt).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`}
            </span>
        </div>
    );
};/**
 * アクションボタン群コンポーネント
 */
const ActionButtons = ({ isLoading, onRefresh, onClose }) => {
    return (
        <div className="flex gap-1 items-center">
            {/* 再読み込みボタン */}
            {!isLoading && (
                <button
                    onClick={onRefresh}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                    title="再読み込み"
                >
                    🔄
                </button>
            )}

            {/* 閉じるボタン */}
            <button
                onClick={onClose}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title="閉じる"
            >
                ✕
            </button>
        </div>
    );
}; export default DocumentHeader;