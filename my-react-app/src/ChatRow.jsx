const ChatRow = ({ data, index, style }) => {
    const cMsg = data[index];

    const FONT_SIZE = 15;
    const MALTIPILER = 1.1;

    const fontSize = FONT_SIZE + cMsg.fav * MALTIPILER;

    return (
        <div style={style} key={cMsg.order} className="chat-cMsg">

            <div
                className="name + time"
                style={{ textAlign: 'left', fontSize, marginLeft: '20px' }}
            >
                <strong>{cMsg.name}</strong> <span>[{cMsg.time}]</span>
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
                        color: cMsg.fav ? 'gold' : 'gray',
                    }}
                    onClick={() => alert('お気に入りボタン仮')} // ここにロジック追加可
                >
                    ★
                </button>
            </div>

        </div>
    );
};

export default ChatRow;