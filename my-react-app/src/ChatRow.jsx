import { useState } from 'react';
import useAppStore from './store/appStore';
import './Doc.css'; // 右端ボタン配置用のスタイルを流用

const ChatRow = ({ data, index, style }) => {
    const cMsg = data.chatMessages[index];
    // --- positive/negative人数 ---
    const positive = cMsg.positive || 0;
    const negative = cMsg.negative || 0;
    
    // カラフルモードの状態を取得
    const isColorfulMode = useAppStore((state) => state.isColorfulMode);
    
    // --- ホバー状態を管理 ---
    const [isHovered, setIsHovered] = useState(false);
    
    // --- ボタンが押されたかどうかを管理（1度だけ押せるように） ---
    const [hasVotedPositive, setHasVotedPositive] = useState(false);
    const [hasVotedNegative, setHasVotedNegative] = useState(false);
    
    // --- 文字サイズと色を⬆⬇の差で決定（差が大きいほど変化） ---
    const diff = positive - negative;
    let fontSize = 15 + diff * 2; // 差が1で17px、2で19px、-1で13pxなど
    if (fontSize > 30) fontSize = 30;
    if (fontSize < 10) fontSize = 10;

    // --- 文字色を差に応じて決定（カラフルモードの場合のみ） ---
    let textColor = '#000'; // デフォルト色
    if (isColorfulMode) {
        if (diff > 0) {
            textColor = '#4CAF50'; // 緑色（ポジティブ）
        } else if (diff < 0) {
            textColor = '#F44336'; // 赤色（ネガティブ）
        }
    }

    // --- emitPositive/emitNegativeを取得 ---
    const addPositive = data.addPositive;
    const addNegative = data.addNegative;
    const handlePositive = () => {
        if (!hasVotedPositive && addPositive) {
            addPositive(cMsg.id);
            setHasVotedPositive(true);
        }
    };
    const handleNegative = () => {
        if (!hasVotedNegative && addNegative) {
            addNegative(cMsg.id);
            setHasVotedNegative(true);
        }
    };

    return (
        <div 
            style={style} 
            key={cMsg.order} 
            className="chat-cMsg list-item-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
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
                        color: textColor,
                        display: 'inline-block',
                    }}
                >
                    {cMsg.msg}
                </span>
                {/* --- positive/negativeボタンを右端に絶対配置（ホバー時のみ表示） --- */}
                {isHovered && (
                    <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
                        <button
                            contentEditable={false}
                            className="chat-positive-btn"
                            style={{
                                fontSize: 18,
                                cursor: hasVotedPositive ? 'not-allowed' : 'pointer',
                                border: 'none',
                                background: 'none',
                                color: hasVotedPositive ? '#ccc' : (isColorfulMode ? '#4CAF50' : '#888'), // カラフルモードでない場合はグレー
                                // color: '#888', // 元のグレー色
                                opacity: hasVotedPositive ? 0.5 : 1,
                            }}
                            onClick={handlePositive}
                            disabled={hasVotedPositive}
                            title={`ポジティブ: ${positive}${hasVotedPositive ? ' (投票済み)' : ''}`}
                        >
                            ⬆
                        </button>
                        <button
                            contentEditable={false}
                            className="chat-negative-btn"
                            style={{
                                fontSize: 18,
                                cursor: hasVotedNegative ? 'not-allowed' : 'pointer',
                                border: 'none',
                                background: 'none',
                                color: hasVotedNegative ? '#ccc' : (isColorfulMode ? '#F44336' : '#bbb'), // カラフルモードでない場合はグレー
                                // color: '#bbb', // 元のグレー色
                                opacity: hasVotedNegative ? 0.5 : 1,
                            }}
                            onClick={handleNegative}
                            disabled={hasVotedNegative}
                            title={`ネガティブ: ${negative}${hasVotedNegative ? ' (投票済み)' : ''}`}
                        >
                            ⬇
                        </button>
                    </span>
                )}
            </div>
        </div>
    );
};

export default ChatRow;