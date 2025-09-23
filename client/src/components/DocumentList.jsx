import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import usePostStore from '../store/postStore';
// import './DocumentList.css'; // スタイルシートがあれば利用

const DocumentList = () => {

    const { id } = useParams();

    // postStoreからデータを取得
    const posts = usePostStore((state) => state.posts);

    // ドキュメントリストの開閉状態
    const [isListOpen, setIsListOpen] = useState(false);

    // ドキュメント情報（1つだけ、全件データ）
    const documentData = {
        id: 'posts-all',
        name: '全投稿データ'
    };

    const openDocumentWindow = () => {
        // 新しいタブでドキュメントページを開く（React Routerを使用）
        const documentUrl = `/document/${id}`;
        window.open(documentUrl, '_blank');
    };

    // 親ウィンドウでのメッセージ受信処理は不要（新しいタブを使用するため）

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
                        onClick={() => openDocumentWindow()}
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
        </div>
    );
};

export default DocumentList;
