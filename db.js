// db.js
require('dotenv').config(); // 環境変数の読み込み
const mongoose = require('mongoose');
console.log('process env MONGODB_URL', process.env.MONGODB_URL);
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/chatment';


// mongoose 接続~
mongoose.connect(MONGODB_URL, { })
    .then(() => { console.log('MongoDB connected'); })
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
    name: String,
    socketId: []
}, options);

const User = mongoose.model("User", userSchema);

// 🌟star スキーマ（Post 内部）
const starSchema = new mongoose.Schema({
    userSocketId: String,
    name: String
});

// 🗨️Post スキーマ / モデル
const postSchema = new mongoose.Schema({
    name: String,
    msg: String,
    stars: [{ type: starSchema, default: () => ({}) }],
}, options);

const Post = mongoose.model("Post", postSchema);

module.exports = { mongoose, User, Post };