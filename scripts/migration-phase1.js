// migration-phase1.js
// Phase 1: 新フィールド追加（後方互換性維持）

const mongoose = require('mongoose');

async function migratePhase1() {
    console.log('=== Phase 1: 新フィールド追加 ===');
    
    const { Space, Room, User } = require('../server/db');
    
    try {
        // 1. Spaceに新フィールド追加
        console.log('1. Space: statusとroomConfigを追加');
        
        const spaces = await Space.find({}).lean();
        let spaceUpdateCount = 0;
        
        for (const space of spaces) {
            const updates = {};
            let needsUpdate = false;
            
            // statusフィールドがない場合のみ追加
            if (!space.status) {
                updates.status = space.isFinished ? 'finished' : 'active';
                needsUpdate = true;
            }
            
            // roomConfigフィールドがない、またはroomsが空の場合に追加
            if (!space.roomConfig || !space.roomConfig.rooms || space.roomConfig.rooms.length === 0) {
                const subRoomSettings = space.settings?.subRoomSettings;
                updates.roomConfig = {
                    mode: subRoomSettings?.enabled ? 'multi' : 'single',
                    rooms: subRoomSettings?.rooms?.map((room, index) => ({
                        name: room.name,
                        isDefault: index === 0
                    })) || [{ name: '全体', isDefault: true }]
                };
                needsUpdate = true;
            }
            
            // statsフィールドがない、またはtotalMessagesがない場合に追加
            if (!space.stats || space.stats.totalMessages === undefined) {
                updates.stats = {
                    totalMessages: space.totalMessageCount || 0,
                    activeRooms: space.roomCount || 0
                };
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                // MongoDBの直接更新を使用（スキーマバリデーションをバイパス）
                await Space.collection.updateOne(
                    { _id: space._id },
                    { $set: updates }
                );
                spaceUpdateCount++;
            }
        }
        
        console.log(`   → ${spaceUpdateCount}/${spaces.length}件のSpaceを更新`);
        
        // 2. Roomに新フィールド追加
        console.log('2. Room: isDefaultとstatsを追加');
        
        const rooms = await Room.find({}).lean();
        let roomUpdateCount = 0;
        
        for (const room of rooms) {
            const updates = {};
            let needsUpdate = false;
            
            // isDefaultフィールドがない場合のみ追加
            if (room.isDefault === undefined || room.isDefault === null) {
                // IDに'main'を含むか、名前が'全体'ならデフォルト
                updates.isDefault = room.id.includes('main') || room.name === '全体';
                needsUpdate = true;
            }
            
            // statsフィールドがない、またはmessageCountがない場合に追加
            if (!room.stats || room.stats.messageCount === undefined) {
                updates.stats = {
                    messageCount: room.messageCount || 0,
                    lastActivity: room.lastActivity || new Date()
                };
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                // MongoDBの直接更新を使用（スキーマバリデーションをバイパス）
                await Room.collection.updateOne(
                    { _id: room._id },
                    { $set: updates }
                );
                roomUpdateCount++;
            }
        }
        
        console.log(`   → ${roomUpdateCount}/${rooms.length}件のRoomを更新`);
        
        // 3. Userに新フィールド追加
        console.log('3. User: isOnline, currentRoom, lastSeenを追加');
        
        const userResult = await User.updateMany(
            { 
                $or: [
                    { isOnline: { $exists: false } },
                    { currentRoom: { $exists: false } },
                    { lastSeen: { $exists: false } }
                ]
            },
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
        return true;
        
    } catch (error) {
        console.error('❌ Phase 1エラー:', error);
        throw error;
    }
}

module.exports = { migratePhase1 };
