const express = require('express');
const router = express.Router();
const { 
  getAllRoomsWithStats, 
  getRoomMessageCounts, 
  explainRoomQuery,
  getActiveRooms,
  getRoomById,
  createRoom
} = require('./dbOperation');

// パフォーマンス測定エンドポイント
router.get('/room-stats', async (req, res) => {
  try {
    console.time('room-stats-api');

    const stats = await getAllRoomsWithStats();
    const messageCounts = await getRoomMessageCounts();

    console.timeEnd('room-stats-api');

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      roomStats: stats,
      messageCounts: messageCounts
    });
  } catch (error) {
    console.error('Room stats API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// インデックス使用状況確認エンドポイント（開発用）
router.get('/db-performance/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const explanation = await explainRoomQuery(roomId);

    res.json({
      success: true,
      roomId: roomId,
      performance: {
        executionTimeMillis: explanation.executionStats.executionTimeMillis,
        totalDocsExamined: explanation.executionStats.totalDocsExamined,
        totalDocsReturned: explanation.executionStats.totalDocsReturned,
        indexUsed: explanation.executionStats.executionStages.indexName || 'No index used'
      }
    });
  } catch (error) {
    console.error('DB performance API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ルーム一覧取得
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await getActiveRooms();
    res.json({
      success: true,
      rooms: rooms,
      count: rooms.length
    });
  } catch (error) {
    console.error('Rooms API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 特定ルーム情報取得
router.get('/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await getRoomById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    res.json({
      success: true,
      room: room
    });
  } catch (error) {
    console.error('Room info API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 新しいルーム作成
router.post('/rooms', async (req, res) => {
  try {
    const { id, name, description, createdByNickname, settings } = req.body;

    if (!id || !name || !createdByNickname) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: id, name, createdByNickname'
      });
    }

    const newRoom = await createRoom({
      id,
      name,
      description,
      createdByNickname,
      settings
    });

    if (!newRoom) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create room'
      });
    }

    // Note: メモリ内のルーム管理は initializeRoomsFromDatabase で同期される

    res.status(201).json({
      success: true,
      room: newRoom
    });

  } catch (error) {
    console.error('Create room API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
