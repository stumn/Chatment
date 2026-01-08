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
        <div className="border-b border-gray-200 bg-white">
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
                    posts={posts}
                    spaceData={spaceData}
                    currentSpaceId={currentSpaceId}
                    docId={docId}
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
            <span className="font-semibold text-lg text-gray-800">
                {spaceData ? spaceData.name : `スペース ${currentSpaceId}`}
            </span>

            {/* メタ情報を1行に */}
            <span className="text-gray-500">
                {isLoading ? '読み込み中...' : `${posts.length}件`}
                {docId && parseInt(docId) > 0 && ` | セクション：${docId}`}
                {spaceData?.lastActivity && ` | 最新：${new Date(spaceData.lastActivity).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`}
                {spaceData?.finishedAt && ` | 終了：${new Date(spaceData.finishedAt).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`}
            </span>
        </div>
    );
};/**
 * アクションボタン群コンポーネント
 */
const ActionButtons = ({ isLoading, onRefresh, onClose, posts, spaceData, currentSpaceId, docId }) => {
    const [copied, setCopied] = React.useState(false);

    /**
     * コピーボタンのクリックハンドラー
     */
    const handleCopy = async () => {
        try {
            // ヘッダー情報を1行で構築
            const headerParts = [];

            // スペース名
            const spaceName = spaceData ? spaceData.name : `スペース ${currentSpaceId}`;
            headerParts.push(`[[${spaceName}]]`);

            // 投稿数
            headerParts.push(`投稿数: ${posts.length}件`);

            // セクション情報
            if (docId && parseInt(docId) > 0) {
                headerParts.push(`セクション: ${docId}`);
            }

            // 最終投稿日時
            if (spaceData?.lastActivity) {
                const lastActivity = new Date(spaceData.lastActivity).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                headerParts.push(`最新: ${lastActivity}`);
            }

            // 終了日時
            if (spaceData?.finishedAt) {
                const finishedAt = new Date(spaceData.finishedAt).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                headerParts.push(`終了: ${finishedAt}`);
            }

            const header = headerParts.join(' | ') + '\n\n';

            // 投稿をdisplayOrder順にソート
            const sortedPosts = [...posts].sort((a, b) => a.displayOrder - b.displayOrder);

            // 投稿内容をテキスト形式に変換
            const postsText = sortedPosts.map((post, index) => {
                const msg = post.msg || '';
                const isHeading = msg.trim().startsWith('#');
                const indentLevel = post.indentLevel || 0;

                if (isHeading) {
                    return msg;
                } else {
                    const indent = '  '.repeat(indentLevel);
                    return `${indent}・ ${msg}`;
                }
            }).join('\n');

            // コピー日時を追加
            const copyDate = new Date().toLocaleString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            const footer = '\n\n\n' + `[# Copy from Chatment: ${copyDate}]`;

            // ヘッダー、投稿内容、フッターを結合
            const text = header + postsText + footer;

            // クリップボードにコピー
            await navigator.clipboard.writeText(text);

            // アイコンをチェックマークに変更
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);

            // 成功フィードバック（オプション）
            console.log('コピーしました');
        } catch (err) {
            console.error('コピーに失敗しました:', err);
        }
    };

    return (
        <div className="flex gap-1 items-center">
            {/* コピーボタン */}
            {!isLoading && posts && posts.length > 0 && (
                <button
                    onClick={handleCopy}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                    title="クリップボードにコピー"
                >
                    {copied ? '✓' : '📋'}
                </button>
            )}

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