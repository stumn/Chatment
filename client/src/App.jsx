// File: client/src/App.jsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// 遅延読み込みでコンポーネントを分割
const SpaceApp = lazy(() => import('./SpaceApp'));
const ChatApp = lazy(() => import('./ChatApp'));
const SpaceDetail = lazy(() => import('./SpaceDetail'));

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
          
          {/* スペース詳細 - パスパラメータ形式 */}
          <Route path="/space/:id" element={<SpaceDetail />} />
          
          {/* チャットアプリ（デフォルト） */}
          <Route path="/" element={<ChatApp />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
