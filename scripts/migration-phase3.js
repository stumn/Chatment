// migration-phase3.js
// Phase 3: データ検証

const mongoose = require('mongoose');

async function migratePhase3() {
    console.log('=== Phase 3: データ検証 ===');
    
    const { Space, Room, User } = require('../server/db');
    
    try {
        // 1. Space検証
        console.log('1. Space検証');
        const totalSpaces = await Space.countDocuments();
        const spacesWithStatus = await Space.countDocuments({ status: { $exists: true } });
        const spacesWithRoomConfig = await Space.countDocuments({ 'roomConfig.mode': { $exists: true } });
        const spacesWithStats = await Space.countDocuments({ 'stats.totalMessages': { $exists: true } });
        
        console.log(`   - 総Space数: ${totalSpaces}`);
        console.log(`   - statusあり: ${spacesWithStatus} ${spacesWithStatus === totalSpaces ? '✅' : '❌'}`);
        console.log(`   - roomConfigあり: ${spacesWithRoomConfig} ${spacesWithRoomConfig === totalSpaces ? '✅' : '❌'}`);
        console.log(`   - statsあり: ${spacesWithStats} ${spacesWithStats === totalSpaces ? '✅' : '❌'}`);
        
        // 2. Room検証
        console.log('2. Room検証');
        const totalRooms = await Room.countDocuments();
        const roomsWithIsDefault = await Room.countDocuments({ isDefault: { $exists: true } });
        const roomsWithStats = await Room.countDocuments({ 'stats.messageCount': { $exists: true } });
        
        console.log(`   - 総Room数: ${totalRooms}`);
        console.log(`   - isDefaultあり: ${roomsWithIsDefault} ${roomsWithIsDefault === totalRooms ? '✅' : '❌'}`);
        console.log(`   - statsあり: ${roomsWithStats} ${roomsWithStats === totalRooms ? '✅' : '❌'}`);
        
        // 3. User検証
        console.log('3. User検証');
        const totalUsers = await User.countDocuments();
        const usersWithIsOnline = await User.countDocuments({ isOnline: { $exists: true } });
        const usersWithCurrentRoom = await User.countDocuments({ currentRoom: { $exists: true } });
        const usersWithLastSeen = await User.countDocuments({ lastSeen: { $exists: true } });
        
        console.log(`   - 総User数: ${totalUsers}`);
        console.log(`   - isOnlineあり: ${usersWithIsOnline} ${usersWithIsOnline === totalUsers ? '✅' : '❌'}`);
        console.log(`   - currentRoomあり: ${usersWithCurrentRoom} ${usersWithCurrentRoom === totalUsers ? '✅' : '❌'}`);
        console.log(`   - lastSeenあり: ${usersWithLastSeen} ${usersWithLastSeen === totalUsers ? '✅' : '❌'}`);
        
        // 4. サンプルデータ表示
        console.log('\n4. サンプルデータ');
        
        if (totalSpaces > 0) {
            const sampleSpace = await Space.findOne({}).lean();
            console.log('\n   Space例:');
            console.log('   - id:', sampleSpace.id);
            console.log('   - name:', sampleSpace.name);
            console.log('   - status:', sampleSpace.status);
            console.log('   - roomConfig:', JSON.stringify(sampleSpace.roomConfig, null, 2));
            console.log('   - stats:', JSON.stringify(sampleSpace.stats, null, 2));
        }
        
        if (totalRooms > 0) {
            const sampleRoom = await Room.findOne({}).lean();
            console.log('\n   Room例:');
            console.log('   - id:', sampleRoom.id);
            console.log('   - name:', sampleRoom.name);
            console.log('   - isDefault:', sampleRoom.isDefault);
            console.log('   - stats:', JSON.stringify(sampleRoom.stats, null, 2));
        }
        
        if (totalUsers > 0) {
            const sampleUser = await User.findOne({}).lean();
            console.log('\n   User例（一部）:');
            console.log('   - nickname:', sampleUser.nickname);
            console.log('   - spaceId:', sampleUser.spaceId);
            console.log('   - isOnline:', sampleUser.isOnline);
            console.log('   - currentRoom:', sampleUser.currentRoom);
            console.log('   - lastSeen:', sampleUser.lastSeen);
        }
        
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
