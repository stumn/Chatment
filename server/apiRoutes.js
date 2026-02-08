const express = require('express');
const router = express.Router();
const {
  getPostsByDisplayOrder,
  // スペース関連操作
  getActiveSpaces,
  getSpaceById,
  createSpace,
  updateSpace,
  getPostsBySpace,
  deactivateSpace,
  updateSpaceStats,
  // 管理者機能
  finishSpace,
  getFinishedSpaces,
  getAllSpaces
} = require('./dbOperation');

// 全ポストデータ取得エンドポイント（スペース指定可能）
router.get('/posts', async (req, res) => {
  try {
    // クエリパラメータからspaceIdを取得
    const { spaceId } = req.query;

    // displayOrder順で投稿を取得（スペース指定がある場合はそのスペースのみ）
    const posts = await getPostsByDisplayOrder(spaceId ? parseInt(spaceId) : null);

    console.log(`Posts API: Retrieved ${posts.length} posts${spaceId ? ` for space ${spaceId}` : ''}`);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      posts: posts,
      count: posts.length,
      spaceId: spaceId || null
    });
  } catch (error) {
    console.error('Posts API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve posts data'
    });
  }
});

// === スペース管理API ===

// スペース一覧取得
router.get('/spaces', async (req, res) => {
  try {
    const spaces = await getActiveSpaces();
    res.json({
      success: true,
      spaces: spaces,
      count: spaces.length
    });
  } catch (error) {
    console.error('Spaces API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 特定スペース情報取得
router.get('/spaces/:spaceId', async (req, res) => {
  try {
    const spaceId = parseInt(req.params.spaceId); // 整数に変換
    const space = await getSpaceById(spaceId);

    if (!space) {
      return res.status(404).json({
        success: false,
        error: 'Space not found'
      });
    }

    res.json({
      success: true,
      space: space
    });
  } catch (error) {
    console.error('Space info API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 新しいスペース作成
router.post('/spaces', async (req, res) => {
  try {
    const { id, name, settings } = req.body;

    if (!id || !name) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: id, name'
      });
    }

    // サブルーム機能廃止により、バリデーションは不要
    const newSpace = await createSpace({
      id: parseInt(id), // 整数に変換
      name,
      settings
    });

    if (!newSpace) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create space'
      });
    }

    res.status(201).json({
      success: true,
      space: newSpace
    });

  } catch (error) {
    console.error('Create space API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// スペース更新
router.put('/spaces/:spaceId', async (req, res) => {
  try {
    const spaceId = parseInt(req.params.spaceId);
    const { name } = req.body;

    if (!spaceId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: spaceId, name'
      });
    }

    // サブルーム機能廃止により、バリデーションは不要
    const updatedSpace = await updateSpace(spaceId, {
      name
    });

    if (!updatedSpace) {
      return res.status(404).json({
        success: false,
        error: 'Space not found or update failed'
      });
    }

    res.json({
      success: true,
      space: updatedSpace
    });

  } catch (error) {
    console.error('Update space API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// スペース別ルーム一覧取得
router.get('/spaces/:spaceId/rooms', async (req, res) => {
  try {
    const spaceId = parseInt(req.params.spaceId); // 整数に変換
    const rooms = await getRoomsBySpace(spaceId);

    res.json({
      success: true,
      spaceId: spaceId,
      rooms: rooms,
      count: rooms.length
    });
  } catch (error) {
    console.error('Space rooms API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// スペース別投稿取得
router.get('/spaces/:spaceId/posts', async (req, res) => {
  try {
    const spaceId = parseInt(req.params.spaceId); // 整数に変換
    const limit = parseInt(req.query.limit) || 100;
    const posts = await getPostsBySpace(spaceId, limit);

    res.json({
      success: true,
      spaceId: spaceId,
      posts: posts,
      count: posts.length
    });
  } catch (error) {
    console.error('Space posts API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// スペースを非アクティブ化
router.delete('/spaces/:spaceId', async (req, res) => {
  try {
    const spaceId = parseInt(req.params.spaceId); // 整数に変換
    const deactivatedSpace = await deactivateSpace(spaceId);

    if (!deactivatedSpace) {
      return res.status(404).json({
        success: false,
        error: 'Space not found or cannot be deactivated'
      });
    }

    res.json({
      success: true,
      space: deactivatedSpace
    });
  } catch (error) {
    console.error('Deactivate space API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// スペースを終了状態にする（管理者機能）
router.post('/spaces/:spaceId/finish', async (req, res) => {
  try {
    const spaceId = parseInt(req.params.spaceId);
    const finishedSpace = await finishSpace(spaceId);

    if (!finishedSpace) {
      return res.status(404).json({
        success: false,
        error: 'Space not found or cannot be finished'
      });
    }

    res.json({
      success: true,
      space: finishedSpace
    });
  } catch (error) {
    console.error('Finish space API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 終了済みスペース一覧を取得（管理者機能）
router.get('/admin/spaces/finished', async (req, res) => {
  try {
    const finishedSpaces = await getFinishedSpaces();

    res.json({
      success: true,
      spaces: finishedSpaces
    });
  } catch (error) {
    console.error('Get finished spaces API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 全スペース一覧を取得（管理者機能）
router.get('/admin/spaces', async (req, res) => {
  try {
    const allSpaces = await getAllSpaces();

    res.json({
      success: true,
      spaces: allSpaces
    });
  } catch (error) {
    console.error('Get all spaces API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// スペースのデータをCSV形式でエクスポート
router.get('/spaces/:spaceId/export/csv', async (req, res) => {
  try {
    const { spaceId } = req.params;

    const posts = await getPostsBySpace(spaceId, 10000); // 大量データに対応

    if (!posts || posts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No posts found for this space'
      });
    }

    // CSVヘッダー
    let csvContent = 'ID,投稿者,内容,投稿日時,表示順序,ポジティブ反応,ネガティブ反応\n';

    // データ行を追加
    posts.forEach(post => {
      const row = [
        post._id || '',
        `"${(post.nickname || '').replace(/"/g, '""')}"`, // CSVエスケープ
        `"${(post.msg || '').replace(/"/g, '""')}"`,
        post.createdAt ? new Date(post.createdAt).toISOString() : '',
        post.displayOrder || 0,
        post.positive || 0,
        post.negative || 0
      ].join(',');
      csvContent += row + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="space_${spaceId}_posts.csv"`);
    res.send('\ufeff' + csvContent); // BOM付きで日本語対応

  } catch (error) {
    console.error('CSV export API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// スペースのデータをJSON形式でエクスポート
router.get('/spaces/:spaceId/export/json', async (req, res) => {
  try {
    const { spaceId } = req.params;

    const [space, posts] = await Promise.all([
      getSpaceById(spaceId),
      getPostsBySpace(spaceId, 10000)
    ]);

    const exportData = {
      space: space,
      posts: posts,
      exportedAt: new Date().toISOString(),
      totalPosts: posts.length
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="space_${spaceId}_data.json"`);
    res.json(exportData);

  } catch (error) {
    console.error('JSON export API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
