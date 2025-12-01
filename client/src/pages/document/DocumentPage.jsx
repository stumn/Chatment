import React from 'react';
import DocumentHeader from '../../components/document/DocumentHeader.jsx';
import DocumentContent from '../../components/document/DocumentContent.jsx';
import { useDocumentData } from '../../hooks/document/useDocumentData.js';

/**
 * 統一ドキュメント表示ページ
 * 
 * 設計思想:
 * - アクティブスペース/終了スペース両方に対応
 * - docIdによる表示内容の分岐
 *   - docId = 0: 全投稿表示
 *   - docId > 0: 見出しレベル別表示（将来実装）
 * 
 * URL形式: /document/:spaceId/:docId
 * アクセス経路:
 * - チャット内ドキュメントリスト → 詳細分割表示用
 * - 管理画面終了スペース → 全投稿ログ閲覧用
 */
const DocumentPage = () => {
    // === カスタムフックでデータ管理 ===
    const {
        posts,
        spaceData,
        currentSpaceId,
        currentDocId,
        docId,
        isLoading,
        error,
        isValidDocId,
        refetch
    } = useDocumentData();



    // 閉じる処理
    const handleClose = () => {
        // 新しいタブを閉じる、またはブラウザの戻る機能を使用
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.close();
        }
    };

    return (
        <div className="min-h-screen bg-white text-left min-w-[800px] max-w-[960px] mx-auto pb-[49px] px-[42px]">
            <DocumentHeader
                spaceData={spaceData}
                currentSpaceId={currentSpaceId}
                docId={docId}
                posts={posts}
                isLoading={isLoading}
                onRefresh={refetch}
                onClose={handleClose}
            />

            <DocumentContent
                posts={posts}
                isLoading={isLoading}
                error={error}
                isValidDocId={isValidDocId}
                currentDocId={currentDocId}
                currentSpaceId={currentSpaceId}
            />
        </div>
    );
};

export default DocumentPage;