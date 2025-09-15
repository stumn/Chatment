import React, { useEffect } from 'react';
// import './DocumentList.css'; // スタイルシートがあれば利用

// モックドキュメントデータ
const documents = [
    { 
        id: 1, 
        name: 'プロジェクト概要', 
        path: '/documents/1',
        content: `
            <h1>📋 プロジェクト概要</h1>
            <h2>目的</h2>
            <p>リアルタイムチャットとドキュメント管理を統合したWebアプリケーションの開発</p>
            
            <h2>主な機能</h2>
            <ul>
                <li>リアルタイムチャット機能</li>
                <li>ドキュメント管理・閲覧</li>
                <li>レスポンシブデザイン</li>
                <li>ユーザー認証</li>
            </ul>
            
            <h2>技術スタック</h2>
            <p><strong>フロントエンド:</strong> React, Zustand, Socket.IO Client</p>
            <p><strong>バックエンド:</strong> Node.js, Express, Socket.IO</p>
            <p><strong>データベース:</strong> SQLite</p>
        `
    },
    { 
        id: 2, 
        name: 'API仕様書', 
        path: '/documents/2',
        content: `
            <h1>🔌 API仕様書</h1>
            
            <h2>認証API</h2>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <strong>POST /api/auth/login</strong><br>
                ユーザーログイン処理
            </div>
            
            <h2>チャットAPI</h2>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <strong>GET /api/chat/rooms</strong><br>
                ルーム一覧取得
            </div>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <strong>POST /api/chat/message</strong><br>
                メッセージ送信
            </div>
            
            <h2>ドキュメントAPI</h2>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <strong>GET /api/documents</strong><br>
                ドキュメント一覧取得
            </div>
            
            <div style="background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #007acc;">
                <strong>💡 Note:</strong> 現在モック実装中です
            </div>
        `
    },
    { 
        id: 3, 
        name: 'ユーザーガイド', 
        path: '/documents/3',
        content: `
            <h1>👥 ユーザーガイド</h1>
            
            <h2>🚀 はじめに</h2>
            <p>Chatmentへようこそ！このガイドでは基本的な使い方をご説明します。</p>
            
            <h2>📝 基本操作</h2>
            <h3>1. ログイン</h3>
            <ol>
                <li>ニックネームを入力</li>
                <li>年齢層を選択</li>
                <li>ステータスを入力</li>
                <li>「ログイン」ボタンをクリック</li>
            </ol>
            
            <h3>2. チャット機能</h3>
            <ul>
                <li><strong>メッセージ送信:</strong> 下部の入力欄にメッセージを入力してEnter</li>
                <li><strong>リアクション:</strong> メッセージにマウスオーバーでリアクションボタンが表示</li>
                <li><strong>ルーム切り替え:</strong> サイドバーからルームを選択</li>
            </ul>
            
            <h3>3. ドキュメント閲覧</h3>
            <ul>
                <li>右上のドキュメントリストから選択</li>
                <li>「別ウィンドウで開く」をクリックで新しいウィンドウで表示</li>
                <li>複数のドキュメントを同時に開くことが可能</li>
            </ul>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107;">
                <strong>⚠️ Tips:</strong> チャットしながらドキュメントを参照できます！
            </div>
        `
    },
];

const DocumentList = () => {
    // 開いているドキュメントウィンドウを管理（シンプルなMap）
    const openWindows = React.useRef(new Map());

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
                            📄 ドキュメントID: ${doc.id} | 別ウィンドウ表示中
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
            <h2 className="document-list-title" style={{
                margin: '0 0 15px 0',
                fontSize: '16px',
                color: '#333',
                borderBottom: '2px solid #007acc',
                paddingBottom: '8px'
            }}>ドキュメントリスト</h2>
            <ul className="document-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {documents.map(doc => (
                    <li key={doc.id} className="document-list-item" style={{
                        marginBottom: '12px',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa',
                        transition: 'all 0.2s',
                        overflow: 'hidden'
                    }}>
                        <button 
                            onClick={() => openDocumentWindow(doc)}
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
                            <span>{doc.name}</span>
                            <span style={{ 
                                fontSize: '16px', 
                                opacity: 0.6,
                                transition: 'all 0.2s'
                            }}>🪟</span>
                        </button>
                    </li>
                ))}
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
                💡 複数のドキュメントを同時に開けます
            </div>
        </div>
    );
};

export default DocumentList;
