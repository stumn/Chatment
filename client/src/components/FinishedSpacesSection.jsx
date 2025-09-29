import React, { useState } from 'react';

// テーブルヘッダーコンポーネント
const TableHeader = ({ columns }) => (
  <thead className="bg-gray-50">
    <tr>
      {columns.map(col => (
        <th key={col} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">{col}</th>
      ))}
    </tr>
  </thead>
);

// 終了した部屋の行をレンダリングするコンポーネント
const FinishedSpaceRow = ({ space }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleDropdownToggle = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  // 外部クリック時にドロップダウンを閉じる
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  const handleViewDocument = () => {
    // 新しいタブで終了済みスペースのログ閲覧ページを開く
    const logUrl = `/document/${space.id}/0`;
    window.open(logUrl, '_blank');
  };

  // 終了日時のフォーマット
  const formatFinishedAt = (finishedAt) => {
    if (!finishedAt) return '不明';
    const date = new Date(finishedAt);
    return date.toLocaleDateString('ja-JP') + ' ' + date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-gray-200">
        {space.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200">
        <span className="relative inline-block mr-2 dropdown-container">
          <button
            className="px-3 py-1 text-blue-500 bg-transparent border-none cursor-pointer text-sm hover:text-blue-700 transition-colors duration-150"
            type="button"
            onClick={() => handleDropdownToggle('export')}
          >
            エクスポート
            <svg className="inline-block ml-1 w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
          <ul
            className={`absolute left-0 mt-2 py-1 w-32 bg-white rounded-md shadow-lg z-10 border ${openDropdown === 'export' ? 'block' : 'hidden'}`}
          >
            <li>
              <a
                href={`/api/spaces/${space.id}/export/csv`}
                className="block px-4 py-2 text-sm text-gray-700 no-underline hover:bg-gray-100 transition-colors duration-150"
                download
                onClick={() => setOpenDropdown(null)}
              >
                📄 CSV
              </a>
            </li>
            <li>
              <a
                href={`/api/spaces/${space.id}/export/json`}
                className="block px-4 py-2 text-sm text-gray-700 no-underline hover:bg-gray-100 transition-colors duration-150"
                download
                onClick={() => setOpenDropdown(null)}
              >
                📄 JSON
              </a>
            </li>
          </ul>
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200">{space.description || '説明なし'}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200">{formatFinishedAt(space.finishedAt)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm border-b border-gray-200">
        <button
          className="px-4 py-2 !bg-blue-500 text-white border-none rounded text-sm font-medium cursor-pointer mr-2 hover:!bg-blue-600 transition-colors duration-150"
          onClick={handleViewDocument}
        >
          ドキュメント閲覧
        </button>
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
      <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-left">終了したコミュニケーションスペース</h2>
      <div className="overflow-x-auto">
        <table className="min-w-[800px] w-full max-w-6xl border-collapse border-b border-gray-200">
          <TableHeader columns={['スペース名', 'エクスポート', '説明', '終了日時', 'アクション']} />
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