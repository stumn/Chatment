import React, { useState } from 'react';

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
  dropdown: {
    position: 'relative',
    display: 'inline-block',
    marginRight: '8px'
  },
  dropdownButton: {
    padding: '4px 12px',
    color: '#3b82f6',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px'
  },
  dropdownMenu: {
    position: 'absolute',
    left: 0,
    marginTop: '8px',
    padding: '4px 0',
    width: '128px',
    backgroundColor: 'white',
    borderRadius: '6px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    zIndex: 10
  },
  dropdownItem: {
    display: 'block',
    padding: '8px 16px',
    fontSize: '14px',
    color: '#374151',
    textDecoration: 'none'
  },
  svg: {
    display: 'inline-block',
    marginLeft: '4px',
    width: '12px',
    height: '12px',
    color: '#6b7280'
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

// 終了した部屋の行をレンダリングするコンポーネント
const FinishedSpaceRow = ({ space }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleDropdownToggle = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  const handleViewDocument = () => {
    // TODO: ドキュメント閲覧機能の実装
    // navigate(`/spaces/${space.id}/documents`);
    console.log(`ドキュメント閲覧: ${space.name}`);
  };

  return (
    <tr>
      <td style={styles.tdName}>
        <a
          href={`/log/${space.id}/`}
          style={styles.link}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          {space.name}
        </a>
      </td>
      <td style={styles.tdGray}>
        {space.files && Object.keys(space.files).length > 0 ? (
          Object.keys(space.files).map(fileType => (
            <span key={fileType} style={styles.dropdown}>
              <button
                style={styles.dropdownButton}
                type="button"
                onClick={() => handleDropdownToggle(fileType)}
                onMouseEnter={(e) => e.target.style.color = '#1d4ed8'}
                onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
              >
                {fileType}
                <svg style={styles.svg} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </button>
              <ul
                style={{
                  ...styles.dropdownMenu,
                  display: openDropdown === fileType ? 'block' : 'none'
                }}
              >
                {space.files[fileType].map(format => (
                  <li key={format}>
                    <a
                      href={`/log/${space.id}/${fileType}.${format}`}
                      style={styles.dropdownItem}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      {format}
                    </a>
                  </li>
                ))}
              </ul>
            </span>
          ))
        ) : (
          <span style={{ color: '#9ca3af' }}>ファイルなし</span>
        )}
      </td>
      <td style={styles.tdGray}>{space.options || 'オプションなし'}</td>
      <td style={styles.td}>
        <button
          style={styles.button}
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
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>終了したコミュニケーションスペース</h2>
      <table style={styles.table}>
        <TableHeader columns={['スペース名', 'ファイル', 'オプション', 'アクション']} />
        <tbody>
          {finishedSpaces.length > 0 ? (
            finishedSpaces.map(space => (
              <FinishedSpaceRow key={space.id} space={space} />
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>
                終了したスペースはありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FinishedSpacesSection;