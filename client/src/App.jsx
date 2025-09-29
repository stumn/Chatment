// File: client/src/App.jsx
// スペースID必須のチャットアプリケーション
// /spaces/:spaceId でChatAppを表示し、/ は /admin にリダイレクト

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// 遅延読み込みでコンポーネントを分割
const SpaceApp = lazy(() => import('./pages/admin/SpaceApp'));
const ChatApp = lazy(() => import('./pages/space/ChatApp'));
const DocumentPage = lazy(() => import('./pages/space/DocumentPage'));
const SpaceLogPage = lazy(() => import('./pages/space/SpaceLogPage'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>Loading...</div>}>
        <Routes>
          {/* 管理画面 */}
          <Route path="/admin" element={<SpaceApp />} />
          
          {/* スペースチャット - 整数型スペースID対応 */}
          <Route path="/spaces/:spaceId" element={<ChatApp />} />
          
          {/* ドキュメント表示 - スペースID + ドキュメントID */}
          <Route path="/document/:spaceId/:docId" element={<DocumentPage />} />
          
          {/* 終了済みスペースのログ表示 */}
          <Route path="/log/:spaceId/:docId" element={<SpaceLogPage />} />
          
          {/* ルートアクセスは管理画面にリダイレクト */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
