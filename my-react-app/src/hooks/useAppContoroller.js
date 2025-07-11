// src/hooks/useAppController.js

// 1. useSocket から socket通信を行う関数 (emit系) を受け取ります。
// 2. usePostStore や useAppStore から 状態を更新する関数 (action系) を受け取ります。

// 🎯UIコンポーネントのために、「状態更新」と「socket通信」を両方実行する
// ⇒　新しい関数（例：addDocument）を定義して提供します。
