import React from 'react';
// import './DocumentList.css'; // スタイルシートがあれば利用

const documents = [
    { id: 1, name: 'ドキュメント１', path: '/documents/1' },
    { id: 2, name: 'ドキュメント２', path: '/documents/2' },
    { id: 3, name: 'ドキュメント３', path: '/documents/3' },
];

const DocumentList = () => {
    return (
        <div className="document-list-container"
            style={{
                right: '20px',
                top: '1.5rem',
                position: 'fixed',
                zIndex: 1000,
                padding: '0 1rem 1rem 1rem',
                border: '1px solid #ccc',
                backgroundColor: '#f9f9f9',
                width: 'auto',
                marginLeft: '1.5rem',
                height: 'auto',
                overflowY: 'auto'
            }}>
            <h2 className="document-list-title">ドキュメントリスト</h2>
            <ul className="document-list">
                {documents.map(doc => (
                    <li key={doc.id} className="document-list-item">
                        <a href={doc.path} target="_blank" rel="noopener noreferrer" className="document-link">
                            {doc.name}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DocumentList;
