import React from 'react';

const styles = {
  section: {
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '16px',
    textAlign: 'left'
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    borderBottom: '1px solid #e5e7eb'
  },
  tableHeader: {
    backgroundColor: '#f9fafb'
  },
  th: {
    padding: '12px 24px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e5e7eb'
  },
  td: {
    padding: '16px 24px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    borderBottom: '1px solid #e5e7eb'
  },
  tdName: {
    padding: '16px 24px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    fontWeight: '500',
    color: '#111827',
    borderBottom: '1px solid #e5e7eb'
  },
  tdGray: {
    padding: '16px 24px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    color: '#6b7280',
    borderBottom: '1px solid #e5e7eb'
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none'
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginRight: '8px'
  },
  buttonSecondary: {
    padding: '8px 16px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginRight: '8px'
  },
  buttonSuccess: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginRight: '8px'
  }
};

// テーブルヘッダーコンポーネント
const TableHeader = ({ columns }) => (
  <thead style={styles.tableHeader}>
    <tr>
      {columns.map(col => (
        <th key={col} scope="col" style={styles.th}>{col}</th>
      ))}
    </tr>
  </thead>
);

// アクティブなスペースの行をレンダリングするコンポーネント
const ActiveSpaceRow = ({ space, selectedSpace, onSelectSpace, onFinishSpace }) => {
  return (
    <tr>
      <td style={styles.tdName}>
        <a
          href={`/spaces/${space.id}`}
          style={styles.link}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          {space.name}
        </a>
      </td>
      <td style={styles.tdGray}>{space.description || '説明なし'}</td>
      <td style={styles.tdGray}>{space.options || 'オプションなし'}</td>
      <td style={styles.td}>
        <button
          style={styles.buttonSuccess}
          onClick={() => onSelectSpace(space)}
          disabled={selectedSpace?.id === space.id}
        >
          入場
        </button>
        <button
          style={{ ...styles.buttonSecondary, backgroundColor: '#ef4444' }}
          onClick={() => onFinishSpace(space.id)}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
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
    <div style={styles.section}>
      <div style={styles.actionBar}>
        <h2 style={styles.sectionTitle}>アクティブなコミュニケーションスペース</h2>
        <button
          style={styles.button}
          onClick={onAddSpaceClick}
        >
          ＋ 新しいスペースを追加
        </button>
      </div>
      <table style={styles.table}>
        <TableHeader columns={['スペース名', '説明', 'オプション', 'アクション']} />
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
              <td colSpan="4" style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>
                アクティブなスペースはありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ActiveSpacesSection;