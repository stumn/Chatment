import { useState } from 'react';
import useAppStore from '../store/appStore';
import '../styles/Chat.css'; // チャット用のスタイル

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

    // 見出し行判定（#で始まる行）
    const isHeading = cMsg.msg && cMsg.msg.trim().startsWith('#');

    // --- 文字サイズと色を⬆⬇の差で決定（差が大きいほど変化） ---
    const diff = positive - negative;
    let fontSize = 15 + diff * 2; // 差が1で17px、2で19px、-1で13pxなど
    if (fontSize > 30) fontSize = 30;
    if (fontSize < 10) fontSize = 10;

    // 見出しの場合はさらに大きく
    if (isHeading) {
        fontSize = Math.max(fontSize * 1.5, 22); // 見出しは最低でも22px
    }

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
            className="chat-cMsg"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="chat-user-info">
                <strong>{cMsg.nickname}</strong>
                <span>{cMsg.time}</span>
            </div>
            <div
                className="chat-message-content"
                style={{ fontSize }}
            >
                <span
                    contentEditable
                    suppressContentEditableWarning
                    className={`chat-message-text ${isHeading ? 'chat-heading' : ''}`}
                    style={{
                        fontSize,
                        color: textColor,
                        fontWeight: isHeading ? 'bold' : 'normal', // 見出しの場合は太字
                    }}
                >
                    {cMsg.msg}
                </span>
                {/* positive/negativeボタン（ホバー時のみ表示） */}
                <div className="chat-buttons-container" style={{ opacity: isHovered ? 1 : 0 }}>
                    <button
                        contentEditable={false}
                        className={`chat-positive-btn ${hasVotedPositive
                            ? 'chat-positive-btn-disabled'
                            : (isColorfulMode ? 'chat-positive-btn-colorful' : 'chat-positive-btn-default')
                            }`}
                        onClick={handlePositive}
                        disabled={hasVotedPositive}
                        title={`ポジティブ: ${positive}${hasVotedPositive ? ' (投票済み)' : ''}`}
                    >
                        ⬆
                    </button>
                    <button
                        contentEditable={false}
                        className={`chat-negative-btn ${hasVotedNegative
                            ? 'chat-negative-btn-disabled'
                            : (isColorfulMode ? 'chat-negative-btn-colorful' : 'chat-negative-btn-default')
                            }`}
                        onClick={handleNegative}
                        disabled={hasVotedNegative}
                        title={`ネガティブ: ${negative}${hasVotedNegative ? ' (投票済み)' : ''}`}
                    >
                        ⬇
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatRow;