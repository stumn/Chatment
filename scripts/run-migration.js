// run-migration.js
// マイグレーション実行スクリプト

require('dotenv').config();
const mongoose = require('mongoose');
const { migratePhase1 } = require('./migration-phase1');
const { migratePhase2 } = require('./migration-phase2');
const { migratePhase3 } = require('./migration-phase3');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/chatment';

async function runMigration() {
    console.log('🚀 データベースマイグレーション開始\n');
    console.log(`📍 接続先: ${MONGODB_URL}\n`);
    
    let success = false;
    
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
            console.log('1. アプリケーションコードを更新（ステップ3）');
            console.log('2. 十分にテスト');
            console.log('3. 安定稼働を確認後、Phase 4（クリーンアップ）を実行');
            success = true;
        } else {
            console.log('⚠️ マイグレーションに問題があります。確認してください。');
        }
        
    } catch (error) {
        console.error('❌ マイグレーションエラー:', error);
        console.error('\nスタックトレース:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ MongoDB接続終了');
        
        // 成功したかどうかで終了コードを変える
        process.exit(success ? 0 : 1);
    }
}

// 実行
console.log('===============================================');
console.log('   Chatment データベースマイグレーション');
console.log('   Phase 1-3: 新フィールド追加と検証');
console.log('===============================================\n');

runMigration();
