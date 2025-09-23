// RoomChat.jsx - ルームIDに応じたチャット画面（パスパラメータ使用）
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

function RoomChat() {
  // パスパラメータからroomIdを取得
  const { roomId } = useParams(); // /room/123 形式
  const currentRoomId = roomId || 'room-0';
  
  const [messages, setMessages] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);

  useEffect(() => {
    // APIでルーム情報を取得
    fetch(`/api/rooms/${currentRoomId}`)
      .then(res => res.json())
      .then(data => setRoomInfo(data));
    
    // Socket.IOでそのルームに参加
    socket.emit('joinRoom', currentRoomId);
    
    return () => {
      socket.emit('leaveRoom', currentRoomId);
    };
  }, [currentRoomId]);

  return (
    <div>
      <h1>{roomInfo?.name || `ルーム ${currentRoomId}`}</h1>
      <div>現在のルームID: {currentRoomId}</div>
      {/* チャットメッセージ表示 */}
      <div>
        {messages.map(msg => (
          <div key={msg.id}>{msg.text}</div>
        ))}
      </div>
    </div>
  );
}

export default RoomChat;