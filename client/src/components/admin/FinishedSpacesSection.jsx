import React, { useState } from 'react';
import DocumentViewButton from './ui/DocumentViewButton';

// テーブルヘッダーコンポーネント
const TableHeader = () => (
  <thead className="bg-gray-50">
    <tr>
      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 border-b border-gray-200 w-[200px]">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </div>
      </th>
      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 border-b border-gray-200 w-[100px]">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
      </th>
      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 border-b border-gray-200 w-[140px]">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
      </th>
      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
          </svg>
        </div>
      </th>
    </tr>
  </thead>
);

// 終了した部屋の行をレンダリングするコンポーネント
const FinishedSpaceRow = ({ space }) => {
  // 終了日時のフォーマット
  const formatFinishedAt = (finishedAt) => {
    if (!finishedAt) return '不明';
    const date = new Date(finishedAt);
    return date.toLocaleDateString('ja-JP') + ' ' + date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <tr>
      <td className="px-3 py-2 text-sm font-medium text-gray-900 border-b border-gray-200 w-[200px] text-left">
        <div className="truncate max-w-[180px]" title={space.name}>
          {space.name}
        </div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200 w-[100px] text-left">
        {space.participantCount || 0} 人
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200 w-[140px] text-left">{formatFinishedAt(space.finishedAt)}</td>
      <td className="px-3 py-2 whitespace-nowrap text-sm border-b border-gray-200 text-left">
        <div className="flex gap-1">
          <DocumentViewButton spaceId={space.id} />
          <a
            href={`/api/spaces/${space.id}/export/json`}
            className="px-3 py-2 !bg-slate-500 !text-white border-none rounded text-sm font-medium cursor-pointer hover:!bg-slate-600 transition-colors duration-150 no-underline flex items-center justify-center"
            download
            title="JSONでエクスポート"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </a>
          <a
            href={`/api/spaces/${space.id}/export/csv`}
            className="px-3 py-2 !bg-slate-400 !text-white border-none rounded text-sm font-medium cursor-pointer hover:!bg-slate-500 transition-colors duration-150 no-underline flex items-center justify-center"
            download
            title="CSVでエクスポート"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </a>
        </div>
      </td>
    </tr>
  );
};

/**
 * 終了したコミュニケーションスペースセクションのコンポーネント
 * 
 * @param {Object} props - コンポーネントのプロップス
 * @param {Array} props.finishedSpaces - 終了したスペースの配列
 */
const FinishedSpacesSection = ({ finishedSpaces = [] }) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-left">終了したスペース</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border-b border-gray-200">
          <TableHeader />
          <tbody>
            {finishedSpaces.length > 0 ? (
              finishedSpaces.map(space => (
                <FinishedSpaceRow key={space.id} space={space} />
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-sm border-b border-gray-200 text-center text-gray-400">
                  終了したスペースはありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinishedSpacesSection;