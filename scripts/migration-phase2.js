// migration-phase2.js
// Phase 2: インデックス追加

const mongoose = require('mongoose');

async function migratePhase2() {
    console.log('=== Phase 2: インデックス追加 ===');
    
    const { User } = require('../server/db');
    
    try {
        // Userコレクションに新しいインデックスを追加
        console.log('1. User: ルーム別オンラインユーザー取得用インデックス追加');
        
        // 既存のインデックスを確認
        const existingIndexes = await User.collection.indexes();
        const indexExists = existingIndexes.some(
            index => {
                const key = index.key;
                return key.spaceId === 1 && key.currentRoom === 1 && key.isOnline === 1;
            }
        );
        
        if (!indexExists) {
            await User.collection.createIndex(
                { spaceId: 1, currentRoom: 1, isOnline: 1 },
                { name: 'spaceId_currentRoom_isOnline' }
            );
            console.log('   ✅ インデックス追加完了');
        } else {
            console.log('   ℹ️ インデックスは既に存在します（スキップ）');
        }
        
        // 既存のインデックス確認
        console.log('2. 既存インデックス確認');
        const indexes = await User.collection.indexes();
        console.log('   現在のインデックス:');
        indexes.forEach(index => {
            console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
        });
        
        console.log('✅ Phase 2完了');
        return true;
        
    } catch (error) {
        console.error('❌ Phase 2エラー:', error);
        throw error;
    }
}

module.exports = { migratePhase2 };
