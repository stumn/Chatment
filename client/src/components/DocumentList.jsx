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
                className="fixed right-5 top-6 z-[1000] !w-12 !h-12 min-w-12 min-h-12 aspect-square !rounded-full !bg-[#007acc] text-white border-none cursor-pointer shadow-lg transition-all duration-200 flex items-center justify-center text-xl leading-none hover:!bg-[#0056b3] hover:scale-105"
                title="ドキュメントリストを開く"
            >
                📚
            </button>
        );
    }

    // ドキュメントリストが開いている場合
    return (
        <div className="document-list-container fixed right-5 top-6 z-[1000] p-4 border border-gray-300 bg-white rounded-lg w-70 ml-6 h-auto max-h-96 overflow-y-auto shadow-lg">

            {/* ヘッダー部分（タイトル + 閉じるボタン） */}
            <div className="flex justify-between items-center mb-4 border-b-2 border-[#007acc] pb-2">
                <h2 className="m-0 text-base text-gray-800">📚 ドキュメントリスト</h2>

                {/* 閉じるボタン（サイドバーと同じSVG） */}
                <button
                    onClick={() => setIsListOpen(false)}
                    className="bg-transparent border-none cursor-pointer p-1 rounded flex items-center justify-center transition-colors duration-200 hover:bg-gray-100"
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
                        className="text-gray-600"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <ul className="document-list list-none p-0 m-0">
                <li className="document-list-item mb-3 border border-gray-200 rounded-lg bg-gray-50 transition-all duration-200 overflow-hidden hover:bg-blue-50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200/50">
                    <button
                        onClick={() => openDocumentWindow()}
                        className="w-full p-4 text-sm bg-transparent text-gray-700 border-none cursor-pointer transition-all duration-200 font-medium text-left flex items-center justify-between hover:text-[#007acc]"
                    >
                        <div>
                            <div className="mb-1">{documentData.name}</div>
                            <div className="text-xs text-gray-500">
                                {posts.length}件の投稿データ
                            </div>
                        </div>
                        <span className="text-base opacity-60 transition-all duration-200">🪟</span>
                    </button>
                </li>
            </ul>
        </div>
    );
};

export default DocumentList;
