import React from 'react';

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

// アクティブなスペースの行をレンダリングするコンポーネント
const ActiveSpaceRow = ({ space, selectedSpace, onSelectSpace, onFinishSpace }) => {
  const handleFinishSpace = () => {
    if (space.id === 1) {
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
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-gray-200">
        <a
          href={`/spaces/${space.id}`}
          className="text-blue-600 no-underline hover:underline"
        >
          {space.name}
        </a>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200">{space.description || '説明なし'}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200">
        {space.roomCount || 0} ルーム / {space.participantCount || 0} 参加者
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm border-b border-gray-200">
        <button
          className="px-4 py-2 !bg-emerald-500 text-white border-none rounded text-sm font-medium cursor-pointer mr-2 hover:!bg-emerald-600 transition-colors duration-150"
          onClick={() => onSelectSpace(space)}
        >
          入場
        </button>
        <button
          className="px-4 py-2 !bg-red-500 text-white border-none rounded text-sm font-medium cursor-pointer mr-2 hover:!bg-red-600 transition-colors duration-150"
          onClick={handleFinishSpace}
          disabled={space.id === 1}
          style={space.id === 1 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          終了
        </button>
      </td>
    </tr>
  );
};

/**
 * アクティブなコミュニケーションスペースセクションのコンポーネント
 * 
 * @param {Object} props - コンポーネントのプロップス
 * @param {Array} props.activeSpaces - アクティブなスペースの配列
 * @param {Object} props.selectedSpace - 現在選択されているスペース
 * @param {Function} props.onSelectSpace - スペースを選択する関数
 * @param {Function} props.onFinishSpace - スペースを終了する関数
 * @param {Function} props.onAddSpaceClick - 新しいスペースを追加するボタンのクリックハンドラ
 */
const ActiveSpacesSection = ({ 
  activeSpaces = [], 
  selectedSpace, 
  onSelectSpace, 
  onFinishSpace, 
  onAddSpaceClick 
}) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-left">アクティブなコミュニケーションスペース</h2>
        <button
          className="px-4 py-2 !bg-blue-500 text-white border-none rounded text-sm font-medium cursor-pointer mr-2 hover:!bg-blue-600 transition-colors duration-150"
          onClick={onAddSpaceClick}
        >
          ＋ 新しいスペースを追加
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[800px] w-full max-w-6xl border-collapse border-b border-gray-200">
        <TableHeader columns={['スペース名', '説明', 'ステータス', 'アクション']} />
        <tbody>
          {activeSpaces.length > 0 ? (
            activeSpaces.map(space => (
              <ActiveSpaceRow 
                key={space.id} 
                space={space}
                selectedSpace={selectedSpace}
                onSelectSpace={onSelectSpace}
                onFinishSpace={onFinishSpace}
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
    </div>
  );
};

export default ActiveSpacesSection;