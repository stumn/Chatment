import React from 'react';

/**
 * 水平線コンポーネント
 * @param {Object} props - プロパティ
 * @param {string} props.className - 追加のCSSクラス名
 */
const HorizontalDivider = ({ className = '' }) => {
    return (
        <div
            className={`border-b border-gray-200 my-1 ${className}`.trim()}
            style={{ marginLeft: '-1.5rem', marginRight: '-1.5rem' }}
        />
    );
};

export default HorizontalDivider;
