// db.js
require('dotenv').config(); // 環境変数の読み込み
const mongoose = require('mongoose');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/chatment';
console.log('process env MONGODB_URL', process.env.MONGODB_URL);

// mongoose 接続~
mongoose.connect(MONGODB_URL, {})
    .then(async () => { 
        console.log('MongoDB connected'); 
        
        // インデックスの作成状況を確認（開発環境）
        if (process.env.NODE_ENV === 'development') {
            try {
                const indexes = await Post.collection.getIndexes();
                console.log('📊 Current Post collection indexes:');
                Object.keys(indexes).forEach(indexName => {
                    console.log(`  - ${indexName}:`, indexes[indexName]);
                });
            } catch (error) {
                console.error('Error checking indexes:', error);
            }
        }
    })
    .catch(err => { console.error('MongoDB connection error:', err); });

// オプション設定
const options = {
    timestamps: true,
    toObject: {
        virtuals: true,
        versionKey: false,
        transform: (_, ret) => { delete ret._id; return ret; }
    }
};

// 🙋user スキーマ
const userSchema = new mongoose.Schema({
    nickname: String,
    status: String, // 属性
    ageGroup: String, // 年代
    socketId: []
}, options);

const User = mongoose.model("User", userSchema);

// 🏠Room スキーマ / モデル
const roomSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true }, // ルームID（room-1, room-2など）
    name: { type: String, required: true }, // ルーム名
    description: { type: String, default: '' }, // ルーム説明
    
    // ルームの設定
    isActive: { type: Boolean, default: true }, // アクティブ状態
    isPrivate: { type: Boolean, default: false }, // プライベートルーム
    maxParticipants: { type: Number, default: 100 }, // 最大参加者数
    
    // 作成者情報
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByNickname: { type: String, required: true },
    
    // 統計情報（パフォーマンス向上のため）
    messageCount: { type: Number, default: 0 }, // メッセージ数
    participantCount: { type: Number, default: 0 }, // 現在の参加者数
    lastActivity: { type: Date, default: Date.now }, // 最後のアクティビティ時刻
    
    // ルーム固有の設定
    settings: {
        autoDeleteMessages: { type: Boolean, default: false }, // メッセージ自動削除
        messageRetentionDays: { type: Number, default: 30 }, // メッセージ保持日数
        allowAnonymous: { type: Boolean, default: true } // 匿名参加許可
    }
}, options);

// Roomコレクション用のインデックス
roomSchema.index({ id: 1 }, { unique: true }); // ルームID検索用
roomSchema.index({ isActive: 1, createdAt: -1 }); // アクティブルーム一覧用
roomSchema.index({ lastActivity: -1 }); // アクティビティ順ソート用

const Room = mongoose.model("Room", roomSchema);

// 🌟positive/negative スキーマ（Post 内部）
const positiveSchema = new mongoose.Schema({
    userSocketId: String,
    nickname: String
});
const negativeSchema = new mongoose.Schema({
    userSocketId: String,
    nickname: String
});

// 🗨️Post スキーマ / モデル
const postSchema = new mongoose.Schema({
    nickname: String,
    msg: String,

    // --- 投稿者のUser._idを保存するuserIdフィールドを追加 ---
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // --- ルーム機能: メッセージが送信されたルームのID ---
    roomId: { type: String, default: null },

    positive: [{ type: positiveSchema, default: () => ({}) }],
    negative: [{ type: negativeSchema, default: () => ({}) }],

    // --- 浮動小数点数で順番を管理　前後の投稿のこの値の中間値を設定 ---
    displayOrder: { type: Number, default: 0 },

    // --- 新規行追加者の情報を保持 ---
    previousData: {
        nickname: String,
        createdAt: Date
    }
}, options);

// パフォーマンス最適化のためのインデックス設定
postSchema.index({ roomId: 1, createdAt: -1 }); // ルーム別の時系列取得用
postSchema.index({ displayOrder: 1 }); // ドキュメント表示用
postSchema.index({ createdAt: -1 }); // 一般的な時系列取得用
postSchema.index({ userId: 1 }); // ユーザー別取得用

const Post = mongoose.model("Post", postSchema);

// 📝Log スキーマ / モデル
const logSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: String, // 操作種別
    detail: Object, // 操作内容
    timestamp: { type: Date, default: Date.now }
}, options);

const Log = mongoose.model("Log", logSchema);

// TODO: UserのsocketId（配列）がサーバ・フロントで正しく利用されているか要確認
// TODO: PostのuserIdがフロントで利用されていない場合、今後のユーザー管理・紐付けに注意
// TODO: positive/negativeの構造がフロントのstoreと一致しているか要確認

module.exports = { mongoose, User, Room, Post, Log };