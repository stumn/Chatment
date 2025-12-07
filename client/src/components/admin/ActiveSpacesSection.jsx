import React from 'react';
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

// アクティブなスペースの行をレンダリングするコンポーネント
const ActiveSpaceRow = ({ space, onSelectSpace, onFinishSpace, onEditSpace }) => {

  // 最終更新日時のフォーマット
  const formatUpdatedAt = (updatedAt) => {
    if (!updatedAt) return '不明';
    const date = new Date(updatedAt);
    return date.toLocaleDateString('ja-JP') + ' ' + date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const GoButton = () => {
    return (
      <button
        className="px-4 py-2 !bg-green-600 text-white border-none rounded text-sm font-medium cursor-pointer mr-2 hover:!bg-green-700 transition-colors duration-150"
        onClick={() => onSelectSpace(space)}
      >
        Go
      </button>
    );
  };

  const EditNameButton = () => {
    return (
      <button
        className="px-3 py-2 !bg-slate-500 text-white border-none rounded text-sm font-medium cursor-pointer mr-2 hover:!bg-slate-600 transition-colors duration-150 flex items-center justify-center"
        onClick={() => onEditSpace(space)}
        title="名前を変更"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      </button>
    );
  };

  const FinishSpaceButton = () => {
    return (
      <button
        className={`px-3 py-2 text-white border-none rounded text-sm font-medium mr-2 transition-colors duration-150 flex items-center justify-center ${space.id === 1
          ? '!bg-neutral-400 !cursor-not-allowed'
          : '!bg-slate-400 cursor-pointer hover:!bg-slate-500'
          }`}
        onClick={handleFinishSpace}
        disabled={space.id === 1}
        title="スペースを終了"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    );
  };

  const handleFinishSpace = () => {
    if (space.id === 0) {
      alert('デフォルトスペースは終了できません。');
      return;
    }

    const confirmed = window.confirm(
      `スペース「${space.name}」を終了しますか？\n\n終了後は再び開始することはできませんが、ドキュメントの閲覧は可能です。`
    );

    if (confirmed) {
      onFinishSpace(space.id);
    }
  };

  return (
    <tr>
      <td className="px-3 py-2 text-sm font-medium text-gray-900 border-b border-gray-200 w-[200px] text-left">
        <div className="truncate max-w-[180px]" title={space.name}>
          {space.name}
        </div>
      </td>

      <td className="px-3 py-2 !whitespace-nowrap text-sm text-gray-500 border-b border-gray-200 w-[100px] text-left">
        {space.participantCount || 0} 人
      </td>

      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200 w-[140px] text-left">
        {formatUpdatedAt(space.updatedAt)}
      </td>

      <td className="flex flex-row px-3 py-2 !whitespace-nowrap text-sm border-b border-gray-200 text-left">
        <GoButton />
        <EditNameButton />
        <DocumentViewButton spaceId={space.id} />
        <FinishSpaceButton />
      </td>
    </tr >
  );
};

/**
 * アクティブなコミュニケーションスペースセクションのコンポーネント
 * 
 * @param {Object} props - コンポーネントのプロップス
 * @param {Array} props.activeSpaces - アクティブなスペースの配列
 * @param {Function} props.onSelectSpace - スペースを選択する関数
 * @param {Function} props.onFinishSpace - スペースを終了する関数
 * @param {Function} props.onEditSpace - スペースを編集する関数
 * @param {Function} props.onAddSpaceClick - 新しいスペースを追加するボタンのクリックハンドラ
 */
const ActiveSpacesSection = ({
  activeSpaces = [],
  onSelectSpace,
  onFinishSpace,
  onEditSpace,
  onAddSpaceClick
}) => {
  return (
    <div className="mb-8">

      <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-left">アクティブスペース</h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border-b border-gray-200">
          <TableHeader />
          <tbody>
            {activeSpaces.length > 0 ? (
              activeSpaces.map(space => (
                <ActiveSpaceRow
                  key={space.id}
                  space={space}
                  onSelectSpace={onSelectSpace}
                  onFinishSpace={onFinishSpace}
                  onEditSpace={onEditSpace}
                />
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm border-b border-gray-200 text-center text-gray-400">
                  アクティブなスペースはありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={onAddSpaceClick}
        className="!w-12 !h-12 min-w-12 min-h-12 aspect-square !rounded-full bg-white !border-2 !border-green-600 cursor-pointer shadow-md transition-all duration-200 flex items-center justify-center hover:bg-green-50 hover:scale-105 text-green-600 text-2xl font-light"
        title="新しいスペースを追加"
      >
        ＋
      </button>
    </div>
  );
};

export default ActiveSpacesSection;