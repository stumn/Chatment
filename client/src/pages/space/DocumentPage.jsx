import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

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
    // === URLパラメータ処理 ===
    const { spaceId, docId } = useParams();
    const currentSpaceId = parseInt(spaceId, 10);
    const currentDocId = parseInt(docId, 10);
    
    // === 状態管理 ===
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [spaceData, setSpaceData] = useState(null);

    // === バリデーション ===
    const isValidDocId = !isNaN(currentDocId) && currentDocId >= 0;
    // 将来拡張: docIdの上限チェック、特定値の予約など
    
    // === URLパラメータバリデーション ===
    useEffect(() => {
        console.log('[DocumentPage] URL Parameters:', { 
            spaceId: spaceId, 
            docId: docId, 
            parsedSpaceId: currentSpaceId, 
            parsedDocId: currentDocId 
        });
        
        // spaceIdのバリデーション
        if (!currentSpaceId || isNaN(currentSpaceId)) {
            const errorMsg = `🚫 無効なスペースID: "${spaceId}"\n\n` +
                           `正の整数を指定してください。\n` +
                           `例: /document/1/0`;
            console.error('Invalid spaceId:', { provided: spaceId, parsed: currentSpaceId });
            setError(errorMsg);
            return;
        }
        
        // docIdのバリデーション  
        if (!isValidDocId) {
            let errorMsg = `🚫 無効なドキュメントID: "${docId}"\n\n`;
            
            if (isNaN(currentDocId)) {
                errorMsg += `数値を指定してください。\n` +
                          `例: /document/${currentSpaceId}/0 （全投稿表示）`;
            } else if (currentDocId < 0) {
                errorMsg += `0以上の整数を指定してください。\n` +
                          `・0: 全投稿表示\n` +
                          `・1以上: セクション別表示（今後実装予定）`;
            }
            
            console.error('Invalid docId:', { provided: docId, parsed: currentDocId, isNaN: isNaN(currentDocId) });
            setError(errorMsg);
            return;
        }
        
        // バリデーション通過時はエラーをクリア
        setError(null);
    }, [spaceId, docId, currentSpaceId, currentDocId, isValidDocId]);

    // === スペース情報取得 ===
    useEffect(() => {
        const fetchSpaceData = async () => {
            if (!currentSpaceId || isNaN(currentSpaceId)) return;

            try {
                const response = await fetch(`/api/spaces/${currentSpaceId}`);
                const data = await response.json();
                
                if (data.success) {
                    setSpaceData(data.space);
                } else {
                    throw new Error(data.error || 'スペース情報の取得に失敗しました');
                }
            } catch (error) {
                console.error('スペース情報取得中にエラーが発生しました:', error);
                setError(error.message);
            }
        };

        fetchSpaceData();
    }, [currentSpaceId]);

    // === API通信: スペース別投稿データ取得 ===
    const fetchPostsFromAPI = async () => {
        /* 責務: 指定されたスペースの投稿データを取得
         * - 常にスペース別APIエンドポイントを使用
         * - エラー時は適切なエラーメッセージを設定
         * - ローディング状態の管理
         */
        try {
            setIsLoading(true);
            setError(null);
            
            // 常にスペース別APIエンドポイントを使用
            const response = await fetch(`/api/spaces/${currentSpaceId}/posts`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.posts) {
                setPosts(data.posts);
            } else {
                throw new Error(data.error || '投稿データの取得に失敗しました');
            }
            
        } catch (err) {
            console.error('DocumentPage: Error fetching posts:', err);
            setError(err.message || 'データの取得に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    // === 投稿データ取得 ===
    useEffect(() => {
        fetchPostsFromAPI();
    }, [currentSpaceId, docId]); // スペースIDやドキュメントIDが変わった時も再取得

    // postsデータからドキュメント形式に変換する関数
    const generateDocumentContent = () => {
        // バリデーションエラー時は何も表示しない（エラーは別途表示済み）
        if (!isValidDocId) {
            return '';
        }

        if (isLoading) {
            return `
                <div style="text-align: center; padding: 50px; color: #666;">
                    <h2>📖 データを読み込み中...</h2>
                    <p>サーバーからpostsデータを取得しています。</p>
                </div>
            `;
        }

        if (error) {
            // URLパラメータエラーの場合は専用UI
            if (error.includes('無効なスペースID') || error.includes('無効なドキュメントID')) {
                return `
                    <div style="max-width: 600px; margin: 50px auto; padding: 30px; background: #fff5f5; border: 2px solid #fed7d7; border-radius: 12px; text-align: center;">
                        <h2 style="color: #c53030; margin-bottom: 20px;">⚠️ URLパラメータエラー</h2>
                        <pre style="background: #f7fafc; padding: 15px; border-radius: 6px; font-size: 14px; color: #2d3748; white-space: pre-wrap; text-align: left;">${error}</pre>
                        <div style="margin-top: 25px;">
                            <button onclick="window.location.href='/document/${currentSpaceId}/0'" style="
                                padding: 12px 24px; 
                                background: #48bb78; 
                                color: white; 
                                border: none; 
                                border-radius: 6px; 
                                cursor: pointer;
                                margin-right: 10px;
                                font-size: 14px;
                            ">
                                📄 全投稿を表示
                            </button>
                            <button onclick="window.history.back()" style="
                                padding: 12px 24px; 
                                background: #4299e1; 
                                color: white; 
                                border: none; 
                                border-radius: 6px; 
                                cursor: pointer;
                                font-size: 14px;
                            ">
                                ← 戻る
                            </button>
                        </div>
                    </div>
                `;
            }
            
            // その他のエラー（API通信エラーなど）
            return `
                <div style="text-align: center; padding: 50px; color: #e74c3c;">
                    <h2>❌ エラーが発生しました</h2>
                    <p style="white-space: pre-wrap;">${error}</p>
                    <button onclick="window.location.reload()" style="
                        padding: 10px 20px; 
                        background: #6c757d; 
                        color: white; 
                        border: none; 
                        border-radius: 4px; 
                        cursor: pointer;
                        margin-top: 15px;
                    ">
                        再読み込み
                    </button>
                </div>
            `;
        }

        if (!posts || posts.length === 0) {
            return `
                <div style="text-align: center; padding: 50px; color: #666;">
                    <h2>📝 投稿データが見つかりません</h2>
                    <p>チャットでメッセージを投稿すると、ここにドキュメントとして表示されます。</p>
                </div>
            `;
        }

        const sortedPosts = [...posts].sort((a, b) => a.displayOrder - b.displayOrder);
        
        // docId による表示分岐
        if (currentDocId === 0) {
            // docId = 0: 全投稿表示
            return generateAllPostsContent(sortedPosts);
        } else {
            // docId > 0: 見出しレベル別表示（将来実装）
            return generateSectionContent(sortedPosts, currentDocId);
        }
    };

    // === docId = 0: 全投稿表示のコンテンツ生成 ===
    const generateAllPostsContent = (sortedPosts) => {
        /* 責務: スペース内の全投稿を displayOrder 順で表示
         * - 投稿データの HTML 生成
         * - リアクションに基づく色分け表示
         * - 見出し投稿の特別レンダリング
         * - 投稿メタ情報の表示
         */
        let content = `
            <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #6c757d;">
                <h3 style="margin: 0 0 10px 0; color: #495057;">📊 全投稿データ</h3>
                <p style="margin: 0; color: #666; font-size: 14px;">
                    <strong>総件数:</strong> ${sortedPosts.length}件 | 
                    <strong>生成日時:</strong> ${new Date().toLocaleString('ja-JP')}
                </p>
            </div>
            <style>
                .post-item {
                    margin: 8px 0;
                    padding: 12px 16px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    cursor: default;
                    position: relative;
                    border-left: 3px solid transparent;
                }
                
                .post-item:hover {
                    transform: translateX(2px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .post-item:hover .post-meta {
                    opacity: 1;
                    visibility: visible;
                }
                
                .post-meta {
                    position: absolute;
                    top: 8px;
                    right: 12px;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.2s ease;
                    pointer-events: none;
                    z-index: 10;
                }
                
                .post-content {
                    line-height: 1.5;
                    color: #333;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    margin-right: 60px;
                }
            </style>
        `;

        sortedPosts.forEach((post, index) => {
            const isHeading = post.msg && post.msg.trim().startsWith('#');
            const positive = post.positive || 0;
            const negative = post.negative || 0;
            const reactionTotal = positive + negative;
            const reactionScore = positive - negative; // ポジティブ - ネガティブ
            
            // 見出しの場合
            if (isHeading) {
                const headingLevel = (post.msg.match(/^#+/) || ['#'])[0].length;
                const headingText = post.msg.replace(/^#+\s*/, '');
                
                content += `
                    <h${Math.min(headingLevel, 6)} style="
                        color: #2c3e50; 
                        margin: 30px 0 15px 0; 
                        padding: 12px 16px; 
                        background: linear-gradient(90deg, #3498db, #2980b9);
                        color: white;
                        border-radius: 6px;
                        font-weight: 500;
                    ">
                        ${headingText}
                    </h${Math.min(headingLevel, 6)}>
                `;
            } else {
                // 背景色を反応に基づいて決定
                let backgroundColor = '#ffffff';
                let borderColor = '#e9ecef';
                
                if (reactionTotal > 0) {
                    if (reactionScore > 0) {
                        // ポジティブな反応が多い
                        const intensity = Math.min(reactionScore * 0.1, 0.3);
                        backgroundColor = `rgba(76, 175, 80, ${intensity})`; // 緑系
                        borderColor = '#4caf50';
                    } else if (reactionScore < 0) {
                        // ネガティブな反応が多い
                        const intensity = Math.min(Math.abs(reactionScore) * 0.1, 0.3);
                        backgroundColor = `rgba(244, 67, 54, ${intensity})`; // 赤系
                        borderColor = '#f44336';
                    } else {
                        // 同じ数の反応
                        backgroundColor = 'rgba(255, 193, 7, 0.2)'; // 黄色系
                        borderColor = '#ffc107';
                    }
                }
                
                // 特に注目度が高い投稿（リアクション10以上）
                if (reactionTotal >= 10) {
                    borderColor = '#ff9800';
                }
                
                content += `
                    <div class="post-item" style="
                        background: ${backgroundColor};
                        border-left-color: ${borderColor};
                        ${reactionTotal >= 5 ? 'border-left-width: 4px;' : ''}
                    ">
                        <div class="post-meta">
                            👤 ${post.nickname || 'Unknown'}<br>
                            ⏰ ${post.createdAt ? new Date(post.createdAt).toLocaleString('ja-JP') : '時刻不明'}<br>
                            ${reactionTotal > 0 ? `👍${positive} 👎${negative}` : ''}
                        </div>
                        <div class="post-content">${post.msg || '(空のメッセージ)'}</div>
                    </div>
                `;
            }
        });

        return content;
    };

    // === docId > 0: 見出しレベル別表示のコンテンツ生成 ===
    const generateSectionContent = (sortedPosts, sectionId) => {
        /* 将来実装予定の機能:
         * 1. 見出し（#、##、###）による投稿の階層分析
         * 2. sectionIdに対応する見出しレベルの投稿を抽出
         * 3. 階層構造に応じたナビゲーション生成
         * 4. セクション間のリンク機能
         * 
         * 実装例:
         * - docId=1: # レベル1見出しのセクション
         * - docId=2: ## レベル2見出しのセクション
         * - docId=N: 投稿順のN番目のセクション
         */
        
        return `
            <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #6c757d;">
                <h3 style="margin: 0 0 10px 0; color: #495057;">📑 セクション ${sectionId} - 開発準備中</h3>
                <p style="margin: 0; color: #666; font-size: 14px;">
                    <strong>投稿総数:</strong> ${sortedPosts.length}件 | 
                    <strong>実装予定:</strong> 見出しレベル別表示
                </p>
            </div>
            <div style="text-align: center; padding: 50px; color: #666;">
                <h2>🚧 機能開発中</h2>
                <p>見出しレベル別の表示機能を実装中です</p>
                <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 6px; text-align: left; max-width: 400px; margin: 20px auto;">
                    <h4 style="margin: 0 0 10px 0; color: #495057;">実装予定機能:</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #666;">
                        <li>見出し（#）による自動セクション分割</li>
                        <li>階層的なナビゲーション</li>
                        <li>セクション間のリンク機能</li>
                        <li>投稿内容のフィルタリング</li>
                    </ul>
                </div>
                <button onclick="window.location.href='/document/${currentSpaceId}/0'" style="
                    padding: 12px 24px; 
                    background: #6c757d; 
                    color: white; 
                    border: none; 
                    border-radius: 6px; 
                    cursor: pointer;
                    font-size: 14px;
                ">
                    📄 全投稿を表示
                </button>
            </div>
        `;
    };

    return (
        <div style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans JP", sans-serif',
            margin: '0',
            padding: '0',
            background: '#f5f5f5',
            minHeight: '100vh'
        }}>
            <div style={{
                background: 'white',
                margin: '20px auto',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                maxWidth: '900px',
                minHeight: 'calc(100vh - 40px)',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '2px solid #f0f0f0',
                    paddingBottom: '15px',
                    marginBottom: '25px',
                    position: 'sticky',
                    top: '0',
                    background: 'white',
                    zIndex: '10'
                }}>
                    <div>
                        <div style={{
                            background: '#f8f9fa',
                            padding: '12px 16px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#495057',
                            borderLeft: '4px solid #6c757d',
                            marginBottom: '8px'
                        }}>
                            📄 {spaceData ? `${spaceData.name} (ID: ${currentSpaceId})` : `スペース ${currentSpaceId}`}
                        </div>
                        <div style={{
                            fontSize: '12px',
                            color: '#666',
                            marginLeft: '16px'
                        }}>
                            {isLoading ? '読み込み中...' : `${posts.length}件の投稿`}
                            {/* 最終投稿日時の表示（アクティブ/終了済み共通） */}
                            {spaceData?.lastActivity && ` | 最終投稿: ${new Date(spaceData.lastActivity).toLocaleString('ja-JP')}`}
                            {/* 終了済みスペースの場合は終了日時も表示 */}
                            {spaceData?.finishedAt && ` | 終了日時: ${new Date(spaceData.finishedAt).toLocaleString('ja-JP')}`}
                            {/* セクション表示（docId > 0の場合） */}
                            {docId && parseInt(docId) > 0 && ` | セクション: ${docId}`}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {!isLoading && (
                            <button
                                onClick={fetchPostsFromAPI}
                                style={{
                                    background: '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 15px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#45a049';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = '#4caf50';
                                }}
                            >
                                🔄 再読み込み
                            </button>
                        )}
                        <button
                            onClick={() => {
                                // 新しいタブを閉じる、またはブラウザの戻る機能を使用
                                if (window.history.length > 1) {
                                    window.history.back();
                                } else {
                                    window.close();
                                }
                            }}
                            style={{
                                background: '#ff4757',
                                color: 'white',
                                border: 'none',
                                padding: '8px 15px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#ff3838';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = '#ff4757';
                            }}
                        >
                            ✕ 閉じる
                        </button>
                    </div>
                </div>
                <div style={{
                    lineHeight: '1.6',
                    color: '#333'
                }}>
                    <div dangerouslySetInnerHTML={{ __html: generateDocumentContent() }} />
                </div>
            </div>
        </div>
    );
};

export default DocumentPage;