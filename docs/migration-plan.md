# データベースマイグレーション計画

## 🎯 目標

SpaceとRoomの役割分担を明確にし、不要なフィールドを削除してスキーマを最適化する

---

## 📋 マイグレーション手順

### 事前準備

#### 1. バックアップ作成

```bash
# MongoDBのバックアップ
mongodump --uri="mongodb://127.0.0.1:27017/chatment" --out="./backup/$(date +%Y%m%d_%H%M%S)"

# または環境変数を使用
mongodump --uri="$MONGODB_URL" --out="./backup/$(date +%Y%m%d_%H%M%S)"
```

#### 2. 現在のデータ確認

```javascript
// 現在のSpace数を確認
db.spaces.countDocuments();

// 現在のRoom数を確認
db.rooms.countDocuments();

// 現在のUser数を確認
db.users.countDocuments();

// サンプルデータの確認
db.spaces.findOne();
db.rooms.findOne();
db.users.findOne();
```

---

## 🔄 マイグレーションスクリプト

### Phase 1: 新フィールド追加（後方互換性維持）

```javascript
// migration-phase1.js
const mongoose = require('mongoose');
const { Space, Room, User } = require('../server/db');

async function migratePhase1() {
    console.log('=== Phase 1: 新フィールド追加 ===');
    
    try {
        // 1. Spaceに新フィールド追加
        console.log('1. Space: statusとroomConfigを追加');
        const spaceResult = await Space.updateMany(
            { status: { $exists: false } }, // statusがまだないもの
            [{
                $set: {
                    // isFinishedがtrueなら'finished'、そうでなければ'active'
                    status: {
                        $cond: [
                            { $eq: ['$isFinished', true] },
                            'finished',
                            'active'
                        ]
                    },
                    // roomConfigを設定（subRoomSettingsから変換）
                    roomConfig: {
                        mode: {
                            $cond: [
                                { $eq: ['$settings.subRoomSettings.enabled', true] },
                                'multi',
                                'single'
                            ]
                        },
                        rooms: {
                            $ifNull: [
                                {
                                    $map: {
                                        input: '$settings.subRoomSettings.rooms',
                                        as: 'room',
                                        in: {
                                            name: '$$room.name',
                                            isDefault: { $eq: [{ $indexOfArray: ['$settings.subRoomSettings.rooms', '$$room'] }, 0] }
                                        }
                                    }
                                },
                                [{ name: '全体', isDefault: true }]
                            ]
                        }
                    },
                    // stats構造を作成
                    stats: {
                        totalMessages: { $ifNull: ['$totalMessageCount', 0] },
                        activeRooms: { $ifNull: ['$roomCount', 0] }
                    }
                }
            }]
        );
        console.log(`   → ${spaceResult.modifiedCount}件のSpaceを更新`);
        
        // 2. Roomに新フィールド追加
        console.log('2. Room: isDefaultとstatsを追加');
        const roomResult = await Room.updateMany(
            { 'stats.messageCount': { $exists: false } }, // statsがまだないもの
            [{
                $set: {
                    // デフォルトルーム判定（room名に'main'または'全体'を含む）
                    isDefault: {
                        $or: [
                            { $regexMatch: { input: '$id', regex: 'main' } },
                            { $eq: ['$name', '全体'] }
                        ]
                    },
                    // stats構造を作成
                    stats: {
                        messageCount: { $ifNull: ['$messageCount', 0] },
                        lastActivity: { $ifNull: ['$lastActivity', new Date()] }
                    }
                }
            }]
        );
        console.log(`   → ${roomResult.modifiedCount}件のRoomを更新`);
        
        // 3. Userに新フィールド追加
        console.log('3. User: isOnline, currentRoom, lastSeenを追加');
        const userResult = await User.updateMany(
            { isOnline: { $exists: false } }, // isOnlineがまだないもの
            {
                $set: {
                    isOnline: false,
                    currentRoom: null,
                    lastSeen: new Date()
                }
            }
        );
        console.log(`   → ${userResult.modifiedCount}件のUserを更新`);
        
        console.log('✅ Phase 1完了');
        
    } catch (error) {
        console.error('❌ Phase 1エラー:', error);
        throw error;
    }
}

module.exports = { migratePhase1 };
```

### Phase 2: インデックス追加

```javascript
// migration-phase2.js
const mongoose = require('mongoose');
const { User } = require('../server/db');

async function migratePhase2() {
    console.log('=== Phase 2: インデックス追加 ===');
    
    try {
        // Userコレクションに新しいインデックスを追加
        console.log('1. User: ルーム別オンラインユーザー取得用インデックス追加');
        await User.collection.createIndex(
            { spaceId: 1, currentRoom: 1, isOnline: 1 },
            { name: 'spaceId_currentRoom_isOnline' }
        );
        console.log('   ✅ インデックス追加完了');
        
        // 既存のインデックス確認
        console.log('2. 既存インデックス確認');
        const indexes = await User.collection.indexes();
        console.log('   現在のインデックス:');
        indexes.forEach(index => {
            console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
        });
        
        console.log('✅ Phase 2完了');
        
    } catch (error) {
        console.error('❌ Phase 2エラー:', error);
        throw error;
    }
}

module.exports = { migratePhase2 };
```

### Phase 3: データ検証

```javascript
// migration-phase3.js
const mongoose = require('mongoose');
const { Space, Room, User } = require('../server/db');

async function migratePhase3() {
    console.log('=== Phase 3: データ検証 ===');
    
    try {
        // 1. Space検証
        console.log('1. Space検証');
        const totalSpaces = await Space.countDocuments();
        const spacesWithStatus = await Space.countDocuments({ status: { $exists: true } });
        const spacesWithRoomConfig = await Space.countDocuments({ 'roomConfig.mode': { $exists: true } });
        const spacesWithStats = await Space.countDocuments({ 'stats.totalMessages': { $exists: true } });
        
        console.log(`   - 総Space数: ${totalSpaces}`);
        console.log(`   - statusあり: ${spacesWithStatus} (${spacesWithStatus === totalSpaces ? '✅' : '❌'})`);
        console.log(`   - roomConfigあり: ${spacesWithRoomConfig} (${spacesWithRoomConfig === totalSpaces ? '✅' : '❌'})`);
        console.log(`   - statsあり: ${spacesWithStats} (${spacesWithStats === totalSpaces ? '✅' : '❌'})`);
        
        // 2. Room検証
        console.log('2. Room検証');
        const totalRooms = await Room.countDocuments();
        const roomsWithIsDefault = await Room.countDocuments({ isDefault: { $exists: true } });
        const roomsWithStats = await Room.countDocuments({ 'stats.messageCount': { $exists: true } });
        
        console.log(`   - 総Room数: ${totalRooms}`);
        console.log(`   - isDefaultあり: ${roomsWithIsDefault} (${roomsWithIsDefault === totalRooms ? '✅' : '❌'})`);
        console.log(`   - statsあり: ${roomsWithStats} (${roomsWithStats === totalRooms ? '✅' : '❌'})`);
        
        // 3. User検証
        console.log('3. User検証');
        const totalUsers = await User.countDocuments();
        const usersWithIsOnline = await User.countDocuments({ isOnline: { $exists: true } });
        const usersWithCurrentRoom = await User.countDocuments({ currentRoom: { $exists: true } });
        const usersWithLastSeen = await User.countDocuments({ lastSeen: { $exists: true } });
        
        console.log(`   - 総User数: ${totalUsers}`);
        console.log(`   - isOnlineあり: ${usersWithIsOnline} (${usersWithIsOnline === totalUsers ? '✅' : '❌'})`);
        console.log(`   - currentRoomあり: ${usersWithCurrentRoom} (${usersWithCurrentRoom === totalUsers ? '✅' : '❌'})`);
        console.log(`   - lastSeenあり: ${usersWithLastSeen} (${usersWithLastSeen === totalUsers ? '✅' : '❌'})`);
        
        // 4. サンプルデータ表示
        console.log('\n4. サンプルデータ');
        const sampleSpace = await Space.findOne({}, { _id: 0, __v: 0 }).lean();
        const sampleRoom = await Room.findOne({}, { _id: 0, __v: 0 }).lean();
        const sampleUser = await User.findOne({}, { _id: 0, __v: 0 }).lean();
        
        console.log('\n   Space例:');
        console.log(JSON.stringify(sampleSpace, null, 2));
        console.log('\n   Room例:');
        console.log(JSON.stringify(sampleRoom, null, 2));
        console.log('\n   User例（一部）:');
        console.log(JSON.stringify({
            nickname: sampleUser?.nickname,
            spaceId: sampleUser?.spaceId,
            isOnline: sampleUser?.isOnline,
            currentRoom: sampleUser?.currentRoom,
            lastSeen: sampleUser?.lastSeen
        }, null, 2));
        
        console.log('\n✅ Phase 3完了');
        
        // 検証結果の判定
        const allValid = 
            spacesWithStatus === totalSpaces &&
            spacesWithRoomConfig === totalSpaces &&
            spacesWithStats === totalSpaces &&
            roomsWithIsDefault === totalRooms &&
            roomsWithStats === totalRooms &&
            usersWithIsOnline === totalUsers &&
            usersWithCurrentRoom === totalUsers &&
            usersWithLastSeen === totalUsers;
        
        if (allValid) {
            console.log('\n🎉 全てのデータが正常に移行されました！');
            return true;
        } else {
            console.log('\n⚠️ 一部のデータが移行されていません。確認してください。');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Phase 3エラー:', error);
        throw error;
    }
}

module.exports = { migratePhase3 };
```

### Phase 4: 古いフィールド削除（オプション）

```javascript
// migration-phase4-cleanup.js
// ⚠️ 注意: このフェーズは新しいコードが安定稼働した後に実行してください

const mongoose = require('mongoose');
const { Space, Room } = require('../server/db');

async function migratePhase4() {
    console.log('=== Phase 4: 古いフィールド削除（クリーンアップ） ===');
    console.log('⚠️ このフェーズは不可逆的な変更です。バックアップを確認してください。');
    
    // 安全確認
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
        readline.question('本当に古いフィールドを削除しますか？ (yes/no): ', resolve);
    });
    readline.close();
    
    if (answer.toLowerCase() !== 'yes') {
        console.log('❌ キャンセルされました');
        return;
    }
    
    try {
        // 1. Space: 古いフィールド削除
        console.log('1. Space: 古いフィールドを削除');
        const spaceResult = await Space.updateMany(
            {},
            {
                $unset: {
                    isActive: '',
                    isFinished: '',
                    roomCount: '',
                    totalMessageCount: '',
                    participantCount: '',
                    lastActivity: '',
                    'settings.theme': '',
                    'settings.subRoomSettings': ''
                }
            }
        );
        console.log(`   → ${spaceResult.modifiedCount}件のSpaceから古いフィールドを削除`);
        
        // 2. Room: 古いフィールド削除
        console.log('2. Room: 古いフィールドを削除');
        const roomResult = await Room.updateMany(
            {},
            {
                $unset: {
                    maxParticipants: '',
                    messageCount: '',
                    participantCount: '',
                    lastActivity: '',
                    settings: ''
                }
            }
        );
        console.log(`   → ${roomResult.modifiedCount}件のRoomから古いフィールドを削除`);
        
        console.log('✅ Phase 4完了');
        console.log('🎉 マイグレーション完了！');
        
    } catch (error) {
        console.error('❌ Phase 4エラー:', error);
        throw error;
    }
}

module.exports = { migratePhase4 };
```

---

## 🚀 実行方法

### 実行スクリプト（メイン）

```javascript
// run-migration.js
require('dotenv').config();
const mongoose = require('mongoose');
const { migratePhase1 } = require('./migration-phase1');
const { migratePhase2 } = require('./migration-phase2');
const { migratePhase3 } = require('./migration-phase3');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/chatment';

async function runMigration() {
    console.log('🚀 データベースマイグレーション開始\n');
    console.log(`📍 接続先: ${MONGODB_URL}\n`);
    
    try {
        // MongoDB接続
        await mongoose.connect(MONGODB_URL);
        console.log('✅ MongoDB接続成功\n');
        
        // Phase 1: 新フィールド追加
        await migratePhase1();
        console.log('');
        
        // Phase 2: インデックス追加
        await migratePhase2();
        console.log('');
        
        // Phase 3: データ検証
        const isValid = await migratePhase3();
        console.log('');
        
        if (isValid) {
            console.log('🎉 マイグレーション成功！');
            console.log('\n次のステップ:');
            console.log('1. アプリケーションコードを更新');
            console.log('2. 十分にテスト');
            console.log('3. 安定稼働を確認後、Phase 4（クリーンアップ）を実行');
        } else {
            console.log('⚠️ マイグレーションに問題があります。確認してください。');
        }
        
    } catch (error) {
        console.error('❌ マイグレーションエラー:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ MongoDB接続終了');
    }
}

// 実行
runMigration();
```

### コマンド

```bash
# 本番環境（要注意）
node scripts/run-migration.js

# ローカル環境でテスト
MONGODB_URL=mongodb://127.0.0.1:27017/chatment node scripts/run-migration.js

# ドライラン（実際には変更しない - 実装必要）
DRY_RUN=true node scripts/run-migration.js
```

---

## 📊 マイグレーション後の確認事項

### 1. データ整合性チェック

```javascript
// Space
db.spaces.find({ status: { $exists: false } }).count(); // → 0であるべき
db.spaces.find({ roomConfig: { $exists: false } }).count(); // → 0であるべき

// Room
db.rooms.find({ isDefault: { $exists: false } }).count(); // → 0であるべき
db.rooms.find({ 'stats.messageCount': { $exists: false } }).count(); // → 0であるべき

// User
db.users.find({ isOnline: { $exists: false } }).count(); // → 0であるべき
```

### 2. アプリケーション動作確認

- [ ] スペース作成
- [ ] スペース編集
- [ ] ルーム作成（サブルーム設定）
- [ ] ユーザーログイン
- [ ] ルーム参加/離脱
- [ ] メッセージ送信
- [ ] 参加者数表示
- [ ] スペース終了

### 3. パフォーマンス確認

```javascript
// 参加者数取得のパフォーマンス
console.time('participantCount');
const count = await User.countDocuments({
    spaceId: 1,
    currentRoom: 'space1-main',
    isOnline: true
});
console.timeEnd('participantCount'); // → 数ms以内であるべき
```

---

## 🔙 ロールバック手順

### 方法1: バックアップから復元

```bash
# バックアップから復元
mongorestore --uri="mongodb://127.0.0.1:27017/chatment" --drop ./backup/20251007_123456/
```

### 方法2: 新フィールドのみ削除

```javascript
// 新フィールドだけ削除（古いフィールドは残る）
await Space.updateMany({}, {
    $unset: {
        status: '',
        roomConfig: '',
        stats: ''
    }
});

await Room.updateMany({}, {
    $unset: {
        isDefault: '',
        stats: ''
    }
});

await User.updateMany({}, {
    $unset: {
        isOnline: '',
        currentRoom: '',
        lastSeen: ''
    }
});
```

---

## ⚠️ 注意事項

1. **本番環境での実行前に必ずローカルでテストすること**
2. **バックアップは複数世代保持すること**
3. **マイグレーション中はアプリケーションを停止すること（推奨）**
4. **Phase 4（クリーンアップ）は新コードが十分に安定してから実行すること**
5. **ロールバック手順を事前に確認しておくこと**

---

**作成日**: 2025年10月7日  
**ステータス**: 準備完了 - ステップ2で実行予定
