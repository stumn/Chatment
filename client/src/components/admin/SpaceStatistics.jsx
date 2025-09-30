import React from 'react';

/**
 * スペース統計情報を表示するコンポーネント
 * 
 * @param {Object} props - コンポーネントのプロップス
 * @param {Array} props.activeSpaces - アクティブなスペースの配列
 * @param {Array} props.finishedSpaces - 終了したスペースの配列
 */
const SpaceStatistics = ({ activeSpaces = [], finishedSpaces = [] }) => {
  // 統計情報を計算
  const statistics = {
    totalSpaces: activeSpaces.length + finishedSpaces.length,
    activeCount: activeSpaces.length,
    finishedCount: finishedSpaces.length,
    totalRooms: activeSpaces.reduce((total, space) => total + (space.roomCount || 0), 0),
    totalParticipants: activeSpaces.reduce((total, space) => total + (space.participantCount || 0), 0)
  };

  // 統計項目の設定
  const statisticItems = [
    {
      label: '総スペース数',
      value: statistics.totalSpaces,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      label: 'アクティブ',
      value: statistics.activeCount,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      label: '終了済み',
      value: statistics.finishedCount,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-200'
    },
    {
      label: '総ルーム数',
      value: statistics.totalRooms,
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-200'
    },
    {
      label: '総参加者数',
      value: statistics.totalParticipants,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {statisticItems.map((item, index) => (
        <div
          key={index}
          className={`${item.bgColor} ${item.borderColor} border rounded-xl p-4 sm:p-6 text-center`}
        >
          <div className={`text-3xl sm:text-4xl font-bold ${item.textColor} mb-2 sm:mb-3 ${item.value === 0 ? 'opacity-50' : ''}`}>
            {item.value.toLocaleString()}
          </div>
          <div className={`text-xs sm:text-sm text-gray-600 font-medium uppercase tracking-wide leading-tight ${item.value === 0 ? 'opacity-50' : ''}`}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SpaceStatistics;