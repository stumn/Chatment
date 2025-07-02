import { useState } from 'react';
import './Doc.css'; // 右端ボタン配置用のスタイルを流用

const ChatRow = ({ data, index, style }) => {
    const cMsg = data.chatMessages[index];
    // --- positive/negative人数・自分が押したかを取得 ---
    const positive = cMsg.positive || 0;
    const negative = cMsg.negative || 0;
    const isPositive = cMsg.isPositive;
    const isNegative = cMsg.isNegative;
    // --- 文字色をpositive/negative人数で調整 ---
    // positiveが多いほど濃い黄色、negativeが多いほど薄いグレー
    const baseColor = isNegative ? `rgba(120,120,120,${Math.max(0.3, 1 - negative * 0.15)})` : isPositive ? `rgba(255,200,0,${Math.min(1, 0.5 + positive * 0.2)})` : '#333';
    const fontWeight = isPositive ? 'bold' : isNegative ? 'normal' : 'normal';
    const fontStyle = isNegative ? 'italic' : 'normal';
    // --- emitPositive/emitNegativeを取得 ---
    const emitPositive = data.emitPositive;
    const emitNegative = data.emitNegative;
    const handlePositive = () => emitPositive && emitPositive(cMsg.id);
    const handleNegative = () => emitNegative && emitNegative(cMsg.id);

    return (
        <div style={style} key={cMsg.order} className="chat-cMsg list-item-container">
            <div
                className="name + time"
                style={{ textAlign: 'left', fontSize: 15, marginLeft: '20px' }}
            >
                <strong>{cMsg.nickname}</strong> <span>[{cMsg.time}]</span>
            </div>
            <div
                className="message doc-comment-content"
                style={{ textAlign: 'left', fontSize: 15, marginLeft: '40px', color: baseColor, fontWeight, fontStyle, position: 'relative' }}
            >
                <span
                    contentEditable
                    suppressContentEditableWarning
                    style={{
                        fontSize: 15,
                        display: 'inline-block',
                        color: baseColor,
                        fontWeight,
                        fontStyle,
                    }}
                >
                    {cMsg.msg}
                </span>
                {/* --- positive/negativeボタンを右端に絶対配置 --- */}
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
                    <button
                        contentEditable={false}
                        className="chat-positive-btn"
                        style={{
                            fontSize: 18,
                            cursor: 'pointer',
                            border: 'none',
                            background: 'none',
                            color: isPositive ? '#FFD600' : '#888',
                            fontWeight: isPositive ? 'bold' : 'normal',
                        }}
                        onClick={handlePositive}
                        title={`ポジティブ: ${positive}`}
                    >
                        !
                    </button>
                    <button
                        contentEditable={false}
                        className="chat-negative-btn"
                        style={{
                            fontSize: 18,
                            cursor: 'pointer',
                            border: 'none',
                            background: 'none',
                            color: isNegative ? '#888' : '#bbb',
                            fontStyle: isNegative ? 'italic' : 'normal',
                        }}
                        onClick={handleNegative}
                        title={`ネガティブ: ${negative}`}
                    >
                        …
                    </button>
                </span>
            </div>
        </div>
    );
};

export default ChatRow;