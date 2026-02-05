// db.js
require('dotenv').config(); // 環境変数の読み込み
const mongoose = require('mongoose');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/chatment';
console.log('process env MONGODB_URL', process.env.MONGODB_URL);

// mongoose 接続~
mongoose.connect(MONGODB_URL, {})
    .then(async () => {
        console.log('MongoDB connected');
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
    socketId: [],

    // スペースID（ユーザーはスペースごとに別レコードとして管理）
    spaceId: { type: Number, required: true },

    // ログイン履歴
    loginHistory: [{
        socketId: String,
        loginAt: { type: Date, default: Date.now },
        ipAddress: String, // 将来的にIPアドレスも記録できる
        userAgent: String  // 将来的にブラウザ情報も記録できる
    }],

    // 最後のログイン日時（クエリ最適化用）
    lastLoginAt: { type: Date, default: Date.now }
}, options);

// Userコレクション用のインデックス
userSchema.index({ nickname: 1, status: 1, ageGroup: 1, spaceId: 1 }); // スペース別同一ユーザー検索用
userSchema.index({ spaceId: 1, lastLoginAt: -1 }); // スペース別最終ログイン順ソート用
// 削除: userSchema.index({ 'loginHistory.loginAt': -1 }); // 実際に使用されていないため削除

const User = mongoose.model("User", userSchema);

//  Space スキーマ / モデル
const spaceSchema = new mongoose.Schema({
    id: { type: Number, unique: true, required: true }, // 1, 2, 3など（整数）
    name: { type: String, required: true }, // スペース名

    // スペース設定
    isActive: { type: Boolean, default: true }, // アクティブ状態
    isFinished: { type: Boolean, default: false }, // 終了フラグ
    finishedAt: { type: Date, default: null }, // 終了日時

    // 統計情報（パフォーマンス向上のため）
    totalMessageCount: { type: Number, default: 0 }, // 総メッセージ数
    participantCount: { type: Number, default: 0 }, // 現在の参加者数
    lastActivity: { type: Date, default: Date.now }, // 最後のアクティビティ時刻

    // スペース固有の設定
    settings: {
        theme: { type: String, default: 'default' } // テーマ設定
    }
}, options);

// Spaceコレクション用のインデックス
spaceSchema.index({ isActive: 1, createdAt: -1 }); // アクティブスペース一覧用
spaceSchema.index({ lastActivity: -1 }); // アクティビティ順ソート用

const Space = mongoose.model("Space", spaceSchema);

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

    // --- スペース機能: メッセージが送信されたスペースのID ---
    spaceId: { type: Number, required: true }, // 整数型のスペースID

    // --- ソース情報: チャット入力 or ドキュメント編集 ---
    source: { type: String, enum: ['chat', 'document'], default: 'document' },

    positive: [{ type: positiveSchema, default: () => ({}) }],
    negative: [{ type: negativeSchema, default: () => ({}) }],

    // --- 浮動小数点数で順番を管理　前後の投稿のこの値の中間値を設定 ---
    displayOrder: { type: Number, default: 0 },

    // --- インデントレベル (0: なし, 1: 1段階, 2: 2段階) ---
    indentLevel: { type: Number, default: 0, min: 0, max: 2 },

    // --- 新規行追加者の情報を保持 ---
    previousData: {
        nickname: String,
        createdAt: Date
    }
}, options);

// パフォーマンス最適化のためのインデックス設定
postSchema.index({ spaceId: 1, createdAt: -1 }); // スペース別の時系列取得用
postSchema.index({ spaceId: 1, displayOrder: 1 }); // スペース別ドキュメント表示用
postSchema.index({ spaceId: 1, source: 1, createdAt: -1 }); // ソース別時系列取得用（チャット表示最適化）

const Post = mongoose.model("Post", postSchema);

// 📝Log スキーマ / モデル
const logSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    action: String, // 操作種別
    detail: Object, // 操作内容
    spaceId: String, // スペースID
}, options);

const Log = mongoose.model("Log", logSchema);

// TODO: UserのsocketId（配列）がサーバ・フロントで正しく利用されているか要確認
// TODO: PostのuserIdがフロントで利用されていない場合、今後のユーザー管理・紐付けに注意
// TODO: positive/negativeの構造がフロントのstoreと一致しているか要確認

module.exports = { mongoose, User, Post, Log, Space };