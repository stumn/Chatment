const ChatRow = ({ data, index, style }) => {
    const cMsg = data.chatMessages[index];

    const FONT_SIZE = 15;
    const MULTIPLIER = 1.1;

    const fontSize = FONT_SIZE + cMsg.fav * MULTIPLIER; // お気に入りの数に応じてフォントサイズを調整

    const handleFavClick = (e) => {
        cMsg.fav = (cMsg.fav + 1) % 3; // お気に入り状態をトグル
        console.log(`Message ${cMsg.order} favorite state: ${cMsg.fav}`);
        
        if (cMsg.fav === 1) {
            e.target.textContent = '★'; // 星を塗りつぶす
            e.target.style.color = '#F4B400'; // 黄色
        } else if (cMsg.fav === 2) {
            e.target.style.color = '#7AA9F7'; // 青色
        } else {
            e.target.textContent = '☆'; // 星を空にする
            e.target.style.color = 'gray'; // 灰色
        }
        
        // 状態を更新するための関数を呼び出す必要があります
        // 例えば、ReactのuseStateフックを使用している場合は、set
        // setChatMessages([...data.chatMessages]); // 状態を更新
        // ただし、ここでは直接cMsgを変更しているため、親コンポーネントでの再レンダリングが必要です
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
                        color: 'gray',
                    }}
                    onClick={handleFavClick}
                >
                    ☆
                </button>
            </div>

        </div>
    );
};

export default ChatRow;