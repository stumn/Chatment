# データベース再設計ドキュメント

## 📌 目的

SpaceとRoomの役割分担を明確にし、保守性と拡張性を向上させる

## 🎯 設計原則

1. **単一責任の原則**: 各エンティティが明確な責任を持つ
2. **実装済み機能のみ**: 使われていない機能は削除
3. **シンプルな管理**: 不要な設定や統計を削除
4. **User中心の参加者管理**: 既存のUser管理システムを活用

---

## 📊 現在のスキーマと問題点

### Space（スペース）
**役割**: プロジェクト/イベントの管理単位

**問題点**:
- `settings.theme`: 'default'のみで実際には使われていない
- `roomCount`, `totalMessageCount`, `participantCount`: 管理が複雑
- `settings.subRoomSettings`: ルーム構成管理が冗長

### Room（ルーム）
**役割**: チャット実行環境

**問題点**:
- `maxParticipants`: 制限処理が実装されていない
- `participantCount`: Userで管理すべき情報
- `settings.autoDeleteMessages`, `messageRetentionDays`, `allowAnonymous`: 未使用の設定

### User（ユーザー）
**問題点**:
- リアルタイム参加状態が管理されていない
- どのルームにいるかが不明

---

## 🔄 新しいスキーマ設計

### 1. Space（スペース）= プロジェクト管理単位

```javascript
const spaceSchema = new mongoose.Schema({
    // === 基本情報 ===
    id: { type: Number, unique: true, required: true },
    name: { type: String, required: true },
    
    // === 管理機能 ===
    status: { 
        type: String, 
        enum: ['active', 'finished'], 
        default: 'active' 
    },
    finishedAt: { type: Date, default: null },
    
    // === ルーム構成（シンプル化） ===
    roomConfig: {
        mode: { 
            type: String, 
            enum: ['single', 'multi'], 
            default: 'single' 
        },
        rooms: [{ 
            name: { type: String, required: true, maxlength: 10, minlength: 1 },
            isDefault: { type: Boolean, default: false }
        }]
    },
    
    // === 統計情報（最小限） ===
    stats: {
        totalMessages: { type: Number, default: 0 },
        activeRooms: { type: Number, default: 0 }
    }
}, options);
```

**変更内容**:
- ✅ `status`: 'suspended'を削除（active/finishedのみ）
- ✅ `roomConfig`: subRoomSettingsを簡潔化
- ✅ `stats`: 必要最小限の統計のみ
- ❌ `settings.theme`: 削除（未使用）
- ❌ `roomCount`, `participantCount`: 削除（動的計算またはstatsに集約）
- ❌ `lastActivity`: 削除（必要に応じてRoomから取得）

### 2. Room（ルーム）= チャット実行環境

```javascript
const roomSchema = new mongoose.Schema({
    // === 基本情報 ===
    id: { type: String, unique: true, required: true },
    spaceId: { type: Number, required: true, index: true },
    name: { type: String, required: true },
    
    // === 状態管理 ===
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    
    // === 統計情報（最小限） ===
    stats: {
        messageCount: { type: Number, default: 0 },
        lastActivity: { type: Date, default: Date.now }
    }
}, options);
```

**変更内容**:
- ✅ `isDefault`: デフォルトルーム（全体）を識別
- ✅ `stats`: 統計をネスト化
- ❌ `maxParticipants`: 削除（制限処理未実装）
- ❌ `participantCount`: 削除（Userで管理）
- ❌ `settings`: 削除（未使用の設定群）

### 3. User（ユーザー）= 参加者状態管理

```javascript
const userSchema = new mongoose.Schema({
    // ... 既存フィールド ...
    
    // === リアルタイム状態（追加） ===
    currentRoom: { type: String, default: null },      // 現在参加中のルームID
    isOnline: { type: Boolean, default: false },       // オンライン状態
    lastSeen: { type: Date, default: Date.now }        // 最後のアクティビティ
}, options);
```

**変更内容**:
- ✅ `currentRoom`: 現在いるルームを記録
- ✅ `isOnline`: オンライン/オフラインを管理
- ✅ `lastSeen`: 最後のアクティビティ時刻

**インデックス追加**:
```javascript
userSchema.index({ spaceId: 1, currentRoom: 1, isOnline: 1 }); // ルーム別オンラインユーザー取得用
```

---

## 🔀 マイグレーション戦略

### フェーズ1: スキーマ追加（後方互換性維持）
1. 新しいフィールドを追加（既存フィールドは維持）
2. デフォルト値で安全に追加
3. アプリケーションは既存フィールドを使用し続ける

### フェーズ2: データ移行
1. Spaceの`settings.subRoomSettings` → `roomConfig`にコピー
2. Roomの統計を`stats`にネスト化
3. Userに初期値を設定（`isOnline: false`, `currentRoom: null`）

### フェーズ3: アプリケーション更新
1. 新しいフィールドを使用するようコード更新
2. 動作確認とテスト

### フェーズ4: クリーンアップ
1. 古いフィールドを削除
2. 不要なインデックスを削除

---

## 📝 フィールド対応表

### Space

| 現在のフィールド | 新しいフィールド | 変更内容 |
|---|---|---|
| `id` | `id` | 変更なし |
| `name` | `name` | 変更なし |
| `isActive` | ❌ 削除 | statusで管理 |
| `isFinished` | ❌ 削除 | statusで管理 |
| ❌ | `status` | 新規追加（active/finished） |
| `finishedAt` | `finishedAt` | 変更なし |
| `settings.subRoomSettings` | `roomConfig` | 構造変更・簡潔化 |
| `roomCount` | `stats.activeRooms` | 移動・名前変更 |
| `totalMessageCount` | `stats.totalMessages` | 移動 |
| `participantCount` | ❌ 削除 | User.isOnlineで動的計算 |
| `lastActivity` | ❌ 削除 | 必要時にRoomから取得 |
| `settings.theme` | ❌ 削除 | 未使用 |

### Room

| 現在のフィールド | 新しいフィールド | 変更内容 |
|---|---|---|
| `id` | `id` | 変更なし |
| `spaceId` | `spaceId` | 変更なし |
| `name` | `name` | 変更なし |
| `isActive` | `isActive` | 変更なし |
| ❌ | `isDefault` | 新規追加 |
| `maxParticipants` | ❌ 削除 | 未使用 |
| `messageCount` | `stats.messageCount` | 移動 |
| `participantCount` | ❌ 削除 | User.isOnlineで動的計算 |
| `lastActivity` | `stats.lastActivity` | 移動 |
| `settings.*` | ❌ 削除 | 未使用 |

### User

| 現在のフィールド | 新しいフィールド | 変更内容 |
|---|---|---|
| （全既存フィールド） | （維持） | 変更なし |
| ❌ | `currentRoom` | 新規追加 |
| ❌ | `isOnline` | 新規追加 |
| ❌ | `lastSeen` | 新規追加 |

---

## 💡 実装上の注意点

### 1. 参加者数の取得方法

**旧方式**:
```javascript
// Roomのフィールドから取得
const room = await Room.findOne({ id: roomId });
const participantCount = room.participantCount;
```

**新方式**:
```javascript
// Userコレクションから動的計算
const participantCount = await User.countDocuments({
    spaceId: spaceId,
    currentRoom: roomId,
    isOnline: true
});
```

### 2. スペースステータスの管理

**旧方式**:
```javascript
const space = await Space.findOne({ id: spaceId });
if (space.isActive && !space.isFinished) { /* ... */ }
```

**新方式**:
```javascript
const space = await Space.findOne({ id: spaceId });
if (space.status === 'active') { /* ... */ }
```

### 3. ルーム構成の取得

**旧方式**:
```javascript
const subRoomSettings = space.settings?.subRoomSettings;
const rooms = subRoomSettings?.rooms || [];
const enabled = subRoomSettings?.enabled || false;
```

**新方式**:
```javascript
const roomConfig = space.roomConfig;
const rooms = roomConfig?.rooms || [];
const mode = roomConfig?.mode || 'single';
```

---

## 🔍 影響範囲の分析

### サーバーサイド

#### 影響を受けるファイル
- `server/db.js` - スキーマ定義
- `server/db/spaceOperations.js` - Space操作
- `server/db/roomManagement.js` - Room操作
- `server/db/userOperations.js` - User操作（新規フィールド対応）
- `server/handlers/roomHandlers.js` - ルーム参加/離脱ロジック
- `server/handlers/authHandlers.js` - ログイン時の状態更新

#### 主な変更ポイント
1. スペース作成時に`status`, `roomConfig`を設定
2. ルーム作成時に`isDefault`を設定
3. ユーザーログイン時に`isOnline`を更新
4. ルーム参加/離脱時に`currentRoom`を更新
5. 参加者数取得をUser集計に変更

### クライアントサイド

#### 影響を受けるファイル
- `client/src/components/admin/SubRoomSettings.jsx` - roomConfig対応
- `client/src/store/admin/spaceStore.js` - スペース状態管理
- `client/src/store/spaces/roomStore.js` - ルーム状態管理
- `client/src/hooks/useSubRoomControl.js` - サブルーム制御

#### 主な変更ポイント
1. `subRoomSettings` → `roomConfig`への参照変更
2. `space.isActive` → `space.status`への条件変更
3. 参加者数表示のAPI呼び出し変更

---

## 📅 実装スケジュール

### ステップ1: ドキュメント整備 ✅
- [x] 設計ドキュメント作成
- [x] スキーマ対応表作成
- [x] 影響範囲分析

### ステップ2: スキーマ更新とマイグレーション
- [ ] `db.js`のスキーマ定義更新（後方互換性維持）
- [ ] データマイグレーションスクリプト作成
- [ ] バックアップ手順の確立
- [ ] ローカル環境でのテスト

### ステップ3: アプリケーションコード更新
- [ ] サーバーサイド更新
  - [ ] spaceOperations.js
  - [ ] roomManagement.js
  - [ ] userOperations.js
  - [ ] roomHandlers.js
  - [ ] authHandlers.js
- [ ] クライアントサイド更新
  - [ ] SubRoomSettings.jsx
  - [ ] spaceStore.js
  - [ ] roomStore.js
- [ ] 統合テスト
- [ ] 本番デプロイ

---

## 🔒 リスク管理

### リスク1: 既存データの破損
**対策**: 
- マイグレーション前に必ずバックアップ
- ローカル環境で十分にテスト
- 段階的なマイグレーション

### リスク2: ダウンタイム
**対策**:
- 後方互換性を維持した段階的移行
- 新旧両方のフィールドを一時的に維持

### リスク3: パフォーマンス低下
**対策**:
- 適切なインデックス設定
- 参加者数の集計クエリ最適化
- 必要に応じてキャッシング

---

## ✅ チェックリスト

### マイグレーション前
- [ ] データベースの完全バックアップ
- [ ] ローカル環境でのテスト完了
- [ ] 影響範囲の確認完了
- [ ] ロールバック手順の確認

### マイグレーション中
- [ ] 新フィールドの追加
- [ ] データの移行
- [ ] インデックスの更新
- [ ] 動作確認

### マイグレーション後
- [ ] 全機能の動作確認
- [ ] パフォーマンステスト
- [ ] 古いフィールドの削除（十分な期間後）
- [ ] ドキュメントの更新

---

## 📚 参考情報

### データベース操作コマンド

```javascript
// Mongooseを使用したマイグレーション例

// 1. Spaceのマイグレーション
await Space.updateMany(
    {},
    {
        $set: {
            status: { $cond: [{ $eq: ['$isFinished', true] }, 'finished', 'active'] },
            'roomConfig.mode': { $cond: [{ $eq: ['$settings.subRoomSettings.enabled', true] }, 'multi', 'single'] },
            'roomConfig.rooms': '$settings.subRoomSettings.rooms',
            'stats.totalMessages': '$totalMessageCount',
            'stats.activeRooms': '$roomCount'
        }
    }
);

// 2. Roomのマイグレーション
await Room.updateMany(
    {},
    {
        $set: {
            'stats.messageCount': '$messageCount',
            'stats.lastActivity': '$lastActivity'
        },
        $unset: {
            messageCount: '',
            participantCount: '',
            lastActivity: '',
            settings: ''
        }
    }
);

// 3. Userのマイグレーション
await User.updateMany(
    {},
    {
        $set: {
            isOnline: false,
            currentRoom: null,
            lastSeen: new Date()
        }
    }
);
```

---

**作成日**: 2025年10月7日  
**バージョン**: 1.0  
**ステータス**: ステップ1完了 ✅
