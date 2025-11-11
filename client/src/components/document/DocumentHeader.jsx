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
        <div className="flex justify-between items-center border-b-2 border-gray-200 pb-4 mb-6 sticky top-0 bg-white z-10">
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
    );
};

/**
 * スペース情報表示コンポーネント
 */
const SpaceInfo = ({ spaceData, currentSpaceId, docId, posts, isLoading }) => {
    return (
        <div>
            {/* スペース名とID */}
            <div className="bg-gray-50 px-4 py-3 rounded-md text-sm text-gray-600 border-l-4 border-gray-500 mb-2">
                📄 {spaceData ? `${spaceData.name} (ID: ${currentSpaceId})` : `スペース ${currentSpaceId}`}
            </div>
            
            {/* メタ情報 */}
            <div className="text-xs text-gray-500 ml-4">
                {isLoading ? '読み込み中...' : `${posts.length}件の投稿`}
                
                {/* 最終投稿日時の表示（アクティブ/終了済み共通） */}
                {spaceData?.lastActivity && 
                    ` | 最終投稿: ${new Date(spaceData.lastActivity).toLocaleString('ja-JP')}`
                }
                
                {/* 終了済みスペースの場合は終了日時も表示 */}
                {spaceData?.finishedAt && 
                    ` | 終了日時: ${new Date(spaceData.finishedAt).toLocaleString('ja-JP')}`
                }
                
                {/* セクション表示（docId > 0の場合） */}
                {docId && parseInt(docId) > 0 && ` | セクション: ${docId}`}
            </div>
        </div>
    );
};

/**
 * アクションボタン群コンポーネント
 */
const ActionButtons = ({ isLoading, onRefresh, onClose }) => {
    return (
        <div className="flex gap-3 items-center">
            {/* 再読み込みボタン */}
            {!isLoading && (
                <button
                    onClick={onRefresh}
                    className="bg-green-500 hover:bg-green-600 text-white border-none px-4 py-2 rounded-md cursor-pointer text-sm transition-colors duration-200"
                >
                    🔄 再読み込み
                </button>
            )}
            
            {/* 閉じるボタン */}
            <button
                onClick={onClose}
                className="bg-red-500 hover:bg-red-600 text-white border-none px-4 py-2 rounded-md cursor-pointer text-sm transition-colors duration-200"
            >
                ✕ 閉じる
            </button>
        </div>
    );
};

export default DocumentHeader;