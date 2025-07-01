import { useState } from 'react';

const ChatRow = ({ data, index, style }) => {
    const cMsg = data.chatMessages[index];

    // --- fav状態をuseStateで管理し、UIの一貫性を保つ ---
    const [fav, setFav] = useState(cMsg.fav || 0);

    const FONT_SIZE = 15;
    const MULTIPLIER = 1.1;
    const fontSize = FONT_SIZE + fav * MULTIPLIER;

    const handleFavClick = (e) => {
        // 状態を直接変更せず、setFavで管理
        const newFav = (fav + 1) % 3;
        setFav(newFav);
        // UIの見た目も状態に応じて変更
        // 本来は親にコールバックで通知し、storeやサーバーに反映すべき
        // ここではUIのみ反映
    };

    return (
        <div style={style} key={cMsg.order} className="chat-cMsg">

            <div
                className="name + time"
                style={{ textAlign: 'left', fontSize, marginLeft: '20px' }}
            >
                <strong>{cMsg.nickname}</strong> <span>[{cMsg.time}]</span>
            </div>

            <div
                className="message"
                style={{ textAlign: 'left', fontSize, marginLeft: '40px' }}
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

                <button
                    contentEditable={false}
                    style={{
                        fontSize,
                        marginLeft: '10px',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                        color: fav === 1 ? '#F4B400' : fav === 2 ? '#7AA9F7' : 'gray',
                    }}
                    onClick={handleFavClick}
                >
                    {fav === 0 ? '☆' : '★'}
                </button>
            </div>

        </div>
    );
};

export default ChatRow;