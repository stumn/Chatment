import { useState } from 'react';
import './Doc.css'; // 右端ボタン配置用のスタイルを流用

const ChatRow = ({ data, index, style }) => {
    const cMsg = data.chatMessages[index];
    // --- positive/negative人数 ---
    const positive = cMsg.positive || 0;
    const negative = cMsg.negative || 0;
    
    // --- 文字サイズを⬆⬇の差で決定（差が大きいほど変化） ---
    const diff = positive - negative;
    let fontSize = 15 + diff * 2; // 差が1で17px、2で19px、-1で13pxなど
    if (fontSize > 30) fontSize = 30;
    if (fontSize < 10) fontSize = 10;

    // --- emitPositive/emitNegativeを取得 ---
    const addPositive = data.addPositive;
    const addNegative = data.addNegative;
    const handlePositive = () => addPositive && addPositive(cMsg.id);
    const handleNegative = () => addNegative && addNegative(cMsg.id);

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
                style={{ textAlign: 'left', fontSize, marginLeft: '40px', position: 'relative' }}
            >
                <span
                    contentEditable
                    suppressContentEditableWarning
                    style={{
                        fontSize,
                        display: 'inline-block',
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
                            color: '#888',
                        }}
                        onClick={handlePositive}
                        title={`ポジティブ: ${positive}`}
                    >
                        ⬆
                    </button>
                    <button
                        contentEditable={false}
                        className="chat-negative-btn"
                        style={{
                            fontSize: 18,
                            cursor: 'pointer',
                            border: 'none',
                            background: 'none',
                            color: '#bbb',
                        }}
                        onClick={handleNegative}
                        title={`ネガティブ: ${negative}`}
                    >
                        ⬇
                    </button>
                </span>
            </div>
        </div>
    );
};

export default ChatRow;