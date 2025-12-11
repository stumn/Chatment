// URLをリンクに変換するユーティリティ関数

import React from 'react';

/**
 * テキスト内のURLを検出してReactエレメント（リンク）に変換する
 * @param {string} text - 変換するテキスト
 * @returns {Array} React要素の配列
 */
export const linkifyText = (text) => {
    if (!text) return [];

    // URLを検出する正規表現（http, https, wwwで始まるもの）
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;

    const parts = [];
    let lastIndex = 0;
    let match;

    // テキストをURLと通常テキストに分割
    while ((match = urlRegex.exec(text)) !== null) {
        const url = match[0];
        const startIndex = match.index;

        // URL前のテキストを追加
        if (startIndex > lastIndex) {
            parts.push(text.slice(lastIndex, startIndex));
        }

        // URLをリンクとして追加（wwwで始まる場合はhttp://を追加）
        const href = url.startsWith('www.') ? `http://${url}` : url;
        parts.push(
            <a
                key={`link-${startIndex}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
                onClick={(e) => e.stopPropagation()} // クリックイベントの伝播を防ぐ
            >
                {url}
            </a>
        );

        lastIndex = urlRegex.lastIndex;
    }

    // 残りのテキストを追加
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
};
