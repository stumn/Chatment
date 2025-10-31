# データベース改修 - 影響範囲詳細分析

## 📌 概要

SpaceとRoomのスキーマ変更による、サーバーサイドとクライアントサイドへの影響を詳細に分析

---

## 🔍 変更されるフィールドのマッピング

### Space関連の変更

| 変更箇所 | 旧コード | 新コード | 優先度 |
|---------|---------|---------|--------|
| ステータス判定 | `space.isActive && !space.isFinished` | `space.status === 'active'` | 🔴 高 |
| ルーム設定取得 | `space.settings.subRoomSettings` | `space.roomConfig` | 🔴 高 |
| サブルーム有効判定 | `space.settings.subRoomSettings.enabled` | `space.roomConfig.mode === 'multi'` | 🔴 高 |
| ルーム一覧取得 | `space.settings.subRoomSettings.rooms` | `space.roomConfig.rooms` | 🔴 高 |
| ルーム数取得 | `space.roomCount` | `space.stats.activeRooms` | 🟡 中 |
| メッセージ数取得 | `space.totalMessageCount` | `space.stats.totalMessages` | 🟡 中 |
| 参加者数取得 | `space.participantCount` | User集計クエリ | 🟡 中 |

### Room関連の変更

| 変更箇所 | 旧コード | 新コード | 優先度 |
|---------|---------|---------|--------|
| メッセージ数 | `room.messageCount` | `room.stats.messageCount` | 🟡 中 |
| 最終アクティビティ | `room.lastActivity` | `room.stats.lastActivity` | 🟡 中 |
| 参加者数 | `room.participantCount` | User集計クエリ | 🔴 高 |
| デフォルトルーム判定 | 手動チェック | `room.isDefault` | 🟢 低 |

---

## 📂 サーバーサイド：影響を受けるファイル

### 🔴 高優先度（必須修正）

#### 1. `server/db/spaceOperations.js`

**影響箇所**:

```javascript
// LINE 131-175: createSpace関数
// 【変更前】
const newSpace = await Space.create({
    id,
    name,
    settings: {
        theme: settings.theme || 'default',
        subRoomSettings: finalSubRoomSettings
    }
});

// 【変更後】
const newSpace = await Space.create({
    id,
    name,
    status: 'active',
    roomConfig: {
        mode: subRoomSettings?.enabled ? 'multi' : 'single',
        rooms: subRoomSettings?.rooms || [{ name: '全体', isDefault: true }]
    },
    stats: {
        totalMessages: 0,
        activeRooms: 0
    }
});
```

```javascript
// LINE 195-245: updateSpace関数
// 【変更前】
const updateData = {
    name,
    'settings.subRoomSettings': subRoomSettings
};

// 【変更後】
const updateData = {
    name,
    roomConfig: {
        mode: subRoomSettings?.enabled ? 'multi' : 'single',
        rooms: subRoomSettings?.rooms || [{ name: '全体', isDefault: true }]
    }
};
```

```javascript
// LINE 380-400: finishSpace関数
// 【変更前】
const finishedSpace = await Space.findOneAndUpdate(
    { id: spaceId },
    {
        $set: {
            isActive: false,
            isFinished: true,
            finishedAt: new Date()
        }
    }
);

// 【変更後】
const finishedSpace = await Space.findOneAndUpdate(
    { id: spaceId },
    {
        $set: {
            status: 'finished',
            finishedAt: new Date()
        }
    }
);
```

**推定作業時間**: 2-3時間

---

#### 2. `server/db/roomManagement.js`

**影響箇所**:

```javascript
// LINE 120-180: createDefaultRoomsForSpace関数
// 【変更前】
const subRoomSettings = space.settings?.subRoomSettings;
const enabled = subRoomSettings?.enabled;
const roomsConfig = subRoomSettings?.rooms;

// 【変更後】
const roomConfig = space.roomConfig;
const mode = roomConfig?.mode || 'single';
const roomsConfig = roomConfig?.rooms;

// ルーム作成時にisDefaultを設定
const newRoom = await Room.create({
    id: roomId,
    spaceId,
    name: roomName,
    isActive: true,
    isDefault: index === 0, // 最初のルームをデフォルトに
    stats: {
        messageCount: 0,
        lastActivity: new Date()
    }
});
```

```javascript
// LINE 40-65: updateRoomStats関数
// 【変更前】
const updateData = {
    lastActivity: new Date(),
    ...updates
};

// 【変更後】
const updateData = {
    'stats.lastActivity': new Date()
};
// updatesの内容に応じて動的に構築
if (updates.messageCount !== undefined) {
    updateData['stats.messageCount'] = updates.messageCount;
}
```

**推定作業時間**: 1-2時間

---

#### 3. `server/handlers/roomHandlers.js`

**影響箇所**:

```javascript
// LINE 155-200: get-room-list ハンドラー
// 【変更前】
const spaceInfo = {
    id: space.id,
    name: space.name,
    settings: {
        subRoomSettings: space.settings?.subRoomSettings || {
            enabled: false,
            rooms: [{ name: '全体' }]
        }
    }
};

// 【変更後】
const spaceInfo = {
    id: space.id,
    name: space.name,
    roomConfig: space.roomConfig || {
        mode: 'single',
        rooms: [{ name: '全体', isDefault: true }]
    }
};
```

```javascript
// LINE 70-110: join-room ハンドラー
// 参加者数の更新方法を変更

// 【変更前】
await updateRoomStats(roomId, {
    participantCount: room.participants.size
});

// 【変更後】
// Userのステータスを更新
await User.findByIdAndUpdate(userId, {
    $set: {
        currentRoom: roomId,
        isOnline: true,
        lastSeen: new Date()
    }
});

// 参加者数は動的に取得
const participantCount = await User.countDocuments({
    spaceId: spaceId,
    currentRoom: roomId,
    isOnline: true
});
```

**推定作業時間**: 2-3時間

---

#### 4. `server/handlers/authHandlers.js`

**影響箇所**:

```javascript
// LINE 20-60: login ハンドラー
// ログイン時にユーザーのオンライン状態を更新

// 【追加】
await User.findByIdAndUpdate(user._id, {
    $set: {
        isOnline: true,
        lastSeen: new Date()
    }
});

// disconnect時の処理も追加
socket.on('disconnect', async () => {
    await User.updateMany(
        { socketId: socket.id },
        {
            $set: {
                isOnline: false,
                lastSeen: new Date()
            },
            $pull: { socketId: socket.id }
        }
    );
});
```

**推定作業時間**: 1時間

---

### 🟡 中優先度（推奨修正）

#### 5. `server/db/userOperations.js`

**影響箇所**:

```javascript
// 新しいヘルパー関数を追加

// ルーム別のオンラインユーザー数を取得
async function getRoomParticipantCount(spaceId, roomId) {
    try {
        const count = await User.countDocuments({
            spaceId: spaceId,
            currentRoom: roomId,
            isOnline: true
        });
        return count;
    } catch (error) {
        handleErrors(error, 'ルーム参加者数取得中にエラー');
        return 0;
    }
}

// スペース全体のオンラインユーザー数を取得
async function getSpaceParticipantCount(spaceId) {
    try {
        const count = await User.countDocuments({
            spaceId: spaceId,
            isOnline: true
        });
        return count;
    } catch (error) {
        handleErrors(error, 'スペース参加者数取得中にエラー');
        return 0;
    }
}

// エクスポートに追加
module.exports = {
    // ... 既存のエクスポート
    getRoomParticipantCount,
    getSpaceParticipantCount
};
```

**推定作業時間**: 1時間

---

#### 6. `server/apiRoutes.js`

**影響箇所**:

```javascript
// LINE 350-440: PUT /api/spaces/:id
// 【変更前】
const updatedSpace = await updateSpace(spaceId, {
    name,
    subRoomSettings
});

// 【変更後】
const updatedSpace = await updateSpace(spaceId, {
    name,
    roomConfig: {
        mode: subRoomSettings?.enabled ? 'multi' : 'single',
        rooms: subRoomSettings?.rooms
    }
});
```

```javascript
// LINE 280-310: GET /api/spaces (アクティブスペース取得)
// レスポンスの形式を統一

// 【変更後】フロントエンド互換性のためsubRoomSettingsも含める
router.get('/api/spaces', async (req, res) => {
    const spaces = await getActiveSpaces();
    
    // 後方互換性のために変換
    const transformedSpaces = spaces.map(space => ({
        ...space,
        // 新しいroomConfigを保持
        roomConfig: space.roomConfig,
        // 旧形式も一時的にサポート
        settings: {
            subRoomSettings: {
                enabled: space.roomConfig?.mode === 'multi',
                rooms: space.roomConfig?.rooms || []
            }
        }
    }));
    
    res.json({ success: true, spaces: transformedSpaces });
});
```

**推定作業時間**: 1-2時間

---

## 📱 クライアントサイド：影響を受けるファイル

### 🔴 高優先度（必須修正）

#### 1. `client/src/components/admin/SubRoomSettings.jsx`

**影響箇所**:

```javascript
// LINE 10-30: 初期化処理
// 【変更前】
const [enabled, setEnabled] = useState(subRoomSettings?.enabled || false);

// 【変更後】
const [enabled, setEnabled] = useState(
    subRoomSettings?.enabled || 
    subRoomSettings?.mode === 'multi' || 
    false
);

// propsの型も変更
// subRoomSettings → roomConfig
```

```javascript
// LINE 50-60: 設定変更時の構造
// 【変更前】
const newSettings = {
    enabled: newEnabled,
    rooms: rooms
};

// 【変更後】
const newSettings = {
    mode: newEnabled ? 'multi' : 'single',
    rooms: rooms.map((room, index) => ({
        name: room.name,
        isDefault: index === 0
    }))
};
```

**推定作業時間**: 1-2時間

---

#### 2. `client/src/store/admin/spaceStore.js`

**影響箇所**:

```javascript
// LINE 50-100: fetchSpaces関数
// APIレスポンスの処理を更新

// 【変更後】後方互換性を考慮
const normalizedSpaces = spaces.map(space => ({
    ...space,
    // roomConfigを優先、なければsettings.subRoomSettingsにフォールバック
    roomConfig: space.roomConfig || {
        mode: space.settings?.subRoomSettings?.enabled ? 'multi' : 'single',
        rooms: space.settings?.subRoomSettings?.rooms || []
    }
}));
```

```javascript
// LINE 150-200: updateSpace関数
// 【変更前】
const payload = {
    name: spaceName,
    subRoomSettings: subRoomSettings
};

// 【変更後】
const payload = {
    name: spaceName,
    roomConfig: {
        mode: subRoomSettings.enabled ? 'multi' : 'single',
        rooms: subRoomSettings.rooms
    }
};
```

**推定作業時間**: 1-2時間

---

#### 3. `client/src/store/spaces/roomStore.js`

**影響箇所**:

```javascript
// LINE 40-70: setCurrentSpaceInfo関数
// 【変更前】
set({ 
    currentSpaceInfo: spaceInfo,
    subRoomSettings: spaceInfo?.settings?.subRoomSettings || null
});

// 【変更後】
set({ 
    currentSpaceInfo: spaceInfo,
    subRoomSettings: spaceInfo?.roomConfig || null
});
```

```javascript
// LINE 80-100: isSubRoomEnabled関数
// 【変更前】
const enabled = subRoomSettings?.enabled;

// 【変更後】
const enabled = subRoomSettings?.mode === 'multi';
```

**推定作業時間**: 1時間

---

#### 4. `client/src/hooks/useSubRoomControl.js`

**影響箇所**:

```javascript
// LINE 20-40: shouldShowRoomList判定
// 【変更前】
const shouldShow = subRoomSettings?.enabled && rooms.length > 1;

// 【変更後】
const shouldShow = 
    (subRoomSettings?.mode === 'multi' || subRoomSettings?.enabled) && 
    rooms.length > 1;
```

**推定作業時間**: 30分

---

### 🟡 中優先度（推奨修正）

#### 5. `client/src/components/admin/ActiveSpacesSection.jsx`

**影響箇所**:

```javascript
// LINE 10-30: スペース情報の表示
// 【変更前】
{space.roomCount || 0} ルーム / {space.participantCount || 0} 参加者

// 【変更後】
{space.stats?.activeRooms || 0} ルーム / {space.stats?.totalParticipants || 0} 参加者

// または、APIから動的取得に変更
```

**推定作業時間**: 30分

---

#### 6. `client/src/components/admin/SpaceStatistics.jsx`

**影響箇所**:

```javascript
// LINE 10-20: 統計計算
// 【変更前】
totalRooms: activeSpaces.reduce((total, space) => 
    total + (space.roomCount || 0), 0
),
totalParticipants: activeSpaces.reduce((total, space) => 
    total + (space.participantCount || 0), 0
)

// 【変更後】
totalRooms: activeSpaces.reduce((total, space) => 
    total + (space.stats?.activeRooms || 0), 0
),
totalParticipants: activeSpaces.reduce((total, space) => 
    total + (space.stats?.totalParticipants || 0), 0
)
```

**推定作業時間**: 30分

---

## 📊 作業時間見積もり

| カテゴリ | ファイル数 | 推定時間 | 優先度 |
|---------|-----------|---------|--------|
| サーバーサイド（高） | 4 | 6-9時間 | 🔴 |
| サーバーサイド（中） | 2 | 2-3時間 | 🟡 |
| クライアントサイド（高） | 4 | 4-6時間 | 🔴 |
| クライアントサイド（中） | 2 | 1時間 | 🟡 |
| テスト・デバッグ | - | 4-6時間 | 🔴 |
| **合計** | **12** | **17-25時間** | - |

---

## ✅ チェックリスト

### コード修正前
- [ ] データベースのバックアップ完了
- [ ] マイグレーションスクリプトのテスト完了
- [ ] 影響範囲の確認完了

### コード修正中
- [ ] サーバーサイド（高優先度）完了
- [ ] サーバーサイド（中優先度）完了
- [ ] クライアントサイド（高優先度）完了
- [ ] クライアントサイド（中優先度）完了

### コード修正後
- [ ] ローカル環境での動作確認
- [ ] スペース作成・編集テスト
- [ ] ルーム機能テスト
- [ ] 参加者数表示テスト
- [ ] 統合テスト完了

---

**作成日**: 2025年10月7日  
**ステータス**: 分析完了 - ステップ3で実装予定
