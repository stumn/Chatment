import React, { useEffect, useState } from 'react';
import usePostStore from './store/postStore';
// import './DocumentList.css'; // スタイルシートがあれば利用

const DocumentList = () => {
    // postStoreからデータを取得
    const posts = usePostStore((state) => state.posts);
    
    // 開いているドキュメントウィンドウを管理（シンプルなMap）
    const openWindows = React.useRef(new Map());
    
    // ドキュメントリストの開閉状態
    const [isListOpen, setIsListOpen] = useState(false);

    // postsデータからドキュメント形式に変換する関数
    const generateDocumentContent = () => {
        if (!posts || posts.length === 0) {
            return `
                <div style="text-align: center; padding: 50px; color: #666;">
                    <h2>📝 投稿データが見つかりません</h2>
                    <p>チャットでメッセージを投稿すると、ここにドキュメントとして表示されます。</p>
                </div>
            `;
        }

        const sortedPosts = [...posts].sort((a, b) => a.displayOrder - b.displayOrder);
        
        let content = `
            <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007acc;">
                <h1 style="margin: 0 0 10px 0; color: #007acc;">📊 チャット投稿データ全件</h1>
                <p style="margin: 0; color: #666; font-size: 14px;">
                    <strong>総件数:</strong> ${posts.length}件 | 
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
                        backgroundColor = \`rgba(76, 175, 80, \${intensity})\`; // 緑系
                        borderColor = '#4caf50';
                    } else if (reactionScore < 0) {
                        // ネガティブな反応が多い
                        const intensity = Math.min(Math.abs(reactionScore) * 0.1, 0.3);
                        backgroundColor = \`rgba(244, 67, 54, \${intensity})\`; // 赤系
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
                
                content += \`
                    <div class="post-item" style="
                        background: \${backgroundColor};
                        border-left-color: \${borderColor};
                        \${reactionTotal >= 5 ? 'border-left-width: 4px;' : ''}
                    ">
                        <div class="post-meta">
                            � \${post.nickname || 'Unknown'}<br>
                            ⏰ \${post.createdAt ? new Date(post.createdAt).toLocaleString('ja-JP') : '時刻不明'}<br>
                            \${reactionTotal > 0 ? \`👍\${positive} 👎\${negative}\` : ''}
                        </div>
                        <div class="post-content">\${post.msg || '(空のメッセージ)'}</div>
                    </div>
                \`;
            }
        });

        return content;
    };

    // ドキュメント情報（1つだけ、全件データ）
    const documentData = {
        id: 'posts-all',
        name: '全投稿データ',
        content: generateDocumentContent()
    };

    const openDocumentWindow = (doc) => {
        // すでに開いているウィンドウがあるかチェック
        const existingWindow = openWindows.current.get(doc.id);
        if (existingWindow && !existingWindow.closed) {
            existingWindow.focus(); // 既存ウィンドウにフォーカス
            return;
        }

        // 新しいウィンドウを作成
        const windowFeatures = 'width=900,height=700,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no';
        const newWindow = window.open('', `chatment-doc-${doc.id}`, windowFeatures);

        // ドキュメント専用のHTMLを生成
        newWindow.document.write(`
            <!DOCTYPE html>
            <html lang="ja">
            <head>
                <title>${doc.name} - Chatment</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans JP', sans-serif;
                        margin: 0; 
                        padding: 0; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                    }
                    .document-container {
                        background: white;
                        margin: 20px;
                        padding: 40px;
                        border-radius: 12px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                        max-width: 800px;
                        margin: 20px auto;
                        min-height: calc(100vh - 40px);
                        box-sizing: border-box;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 2px solid #f0f0f0;
                        padding-bottom: 15px;
                        margin-bottom: 30px;
                    }
                    .close-btn {
                        background: #ff4757;
                        color: white;
                        border: none;
                        padding: 8px 15px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background 0.2s;
                    }
                    .close-btn:hover {
                        background: #ff3838;
                    }
                    .loading { 
                        text-align: center; 
                        padding: 100px 20px;
                        color: #666;
                        font-size: 18px;
                    }
                    .content {
                        line-height: 1.6;
                        color: #333;
                    }
                    .content h1 {
                        color: #2c3e50;
                        border-bottom: 3px solid #3498db;
                        padding-bottom: 10px;
                    }
                    .content h2 {
                        color: #34495e;
                        margin-top: 30px;
                    }
                    .content h3 {
                        color: #7f8c8d;
                    }
                    .content ul, .content ol {
                        padding-left: 25px;
                    }
                    .content li {
                        margin-bottom: 8px;
                    }
                    .document-info {
                        background: #ecf0f1;
                        padding: 15px;
                        border-radius: 6px;
                        margin-bottom: 20px;
                        font-size: 14px;
                        color: #7f8c8d;
                    }
                </style>
            </head>
            <body>
                <div class="document-container">
                    <div class="header">
                        <div class="document-info">
                            📄 ドキュメントID: ${doc.id}
                        </div>
                        <button class="close-btn" onclick="window.close()">✕ 閉じる</button>
                    </div>
                    <div class="content">
                        <div class="loading">📖 ドキュメントを読み込み中...</div>
                    </div>
                </div>
                <script>
                    // 親ウィンドウとの通信設定
                    window.addEventListener('message', (event) => {
                        if (event.data.type === 'LOAD_DOCUMENT') {
                            document.querySelector('.content').innerHTML = event.data.content;
                        }
                    });
                    
                    // ウィンドウが閉じられる時に親ウィンドウに通知
                    window.addEventListener('beforeunload', () => {
                        if (window.opener) {
                            window.opener.postMessage({
                                type: 'DOCUMENT_WINDOW_CLOSED',
                                docId: ${doc.id}
                            }, '*');
                        }
                    });

                    // ウィンドウが読み込まれたら親に準備完了を通知
                    window.addEventListener('load', () => {
                        if (window.opener) {
                            window.opener.postMessage({
                                type: 'WINDOW_READY',
                                docId: ${doc.id}
                            }, '*');
                        }
                    });
                </script>
            </body>
            </html>
        `);

        // ウィンドウの管理に追加
        openWindows.current.set(doc.id, newWindow);

        // 少し待ってからコンテンツを送信（ウィンドウの準備を待つ）
        setTimeout(() => {
            if (!newWindow.closed) {
                newWindow.postMessage({
                    type: 'LOAD_DOCUMENT',
                    content: doc.content
                }, '*');
            }
        }, 100);
    };

    // 親ウィンドウでのメッセージ受信処理
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data.type === 'DOCUMENT_WINDOW_CLOSED') {
                openWindows.current.delete(event.data.docId);
                console.log(`ドキュメントウィンドウ ${event.data.docId} が閉じられました`);
            } else if (event.data.type === 'WINDOW_READY') {
                console.log(`ドキュメントウィンドウ ${event.data.docId} の準備が完了しました`);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // ドキュメントリストが閉じている場合のアイコンボタン
    if (!isListOpen) {
        return (
            <button
                onClick={() => setIsListOpen(true)}
                style={{
                    position: 'fixed',
                    right: '20px',
                    top: '1.5rem',
                    zIndex: 1000,
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: '#007acc',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                }}
                onMouseOver={e => {
                    e.target.style.background = '#0056b3';
                    e.target.style.transform = 'scale(1.05)';
                }}
                onMouseOut={e => {
                    e.target.style.background = '#007acc';
                    e.target.style.transform = 'scale(1)';
                }}
                title="ドキュメントリストを開く"
            >
                📚
            </button>
        );
    }

    // ドキュメントリストが開いている場合
    return (
        <div className="document-list-container"
            style={{
                right: '20px',
                top: '1.5rem',
                position: 'fixed',
                zIndex: 1000,
                padding: '1rem',
                border: '1px solid #ddd',
                backgroundColor: '#fff',
                borderRadius: '8px',
                width: '280px',
                marginLeft: '1.5rem',
                height: 'auto',
                maxHeight: '400px',
                overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
            
            {/* ヘッダー部分（タイトル + 閉じるボタン） */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                borderBottom: '2px solid #007acc',
                paddingBottom: '8px'
            }}>
                <h2 style={{
                    margin: 0,
                    fontSize: '16px',
                    color: '#333'
                }}>📚 ドキュメントリスト</h2>
                
                {/* 閉じるボタン（サイドバーと同じSVG） */}
                <button
                    onClick={() => setIsListOpen(false)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={e => {
                        e.target.style.background = '#f5f5f5';
                    }}
                    onMouseOut={e => {
                        e.target.style.background = 'transparent';
                    }}
                    title="ドキュメントリストを閉じる"
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="18" 
                        height="18" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        style={{ color: '#666' }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <ul className="document-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li className="document-list-item" style={{
                    marginBottom: '12px',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa',
                    transition: 'all 0.2s',
                    overflow: 'hidden'
                }}>
                    <button 
                        onClick={() => openDocumentWindow(documentData)}
                        style={{ 
                            width: '100%',
                            padding: '16px',
                            fontSize: '14px',
                            background: 'transparent',
                            color: '#495057',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontWeight: '500',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                        onMouseOver={e => {
                            e.target.closest('li').style.backgroundColor = '#e3f2fd';
                            e.target.closest('li').style.transform = 'translateY(-1px)';
                            e.target.closest('li').style.boxShadow = '0 4px 12px rgba(0,123,204,0.2)';
                            e.target.style.color = '#007acc';
                        }}
                        onMouseOut={e => {
                            e.target.closest('li').style.backgroundColor = '#f8f9fa';
                            e.target.closest('li').style.transform = 'translateY(0)';
                            e.target.closest('li').style.boxShadow = 'none';
                            e.target.style.color = '#495057';
                        }}
                    >
                        <div>
                            <div style={{ marginBottom: '4px' }}>{documentData.name}</div>
                            <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                {posts.length}件の投稿データ
                            </div>
                        </div>
                        <span style={{ 
                            fontSize: '16px', 
                            opacity: 0.6,
                            transition: 'all 0.2s'
                        }}>🪟</span>
                    </button>
                </li>
            </ul>
            <div style={{
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#e7f3ff',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#0066cc',
                textAlign: 'center'
            }}>
                💡 リアルタイムでチャットデータを表示
            </div>
        </div>
    );
};

export default DocumentList;
