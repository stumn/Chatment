import React, { useState } from 'react';

const styles = {
    modal: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    modalContent: {
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90%'
    },
    input: {
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        fontSize: '14px',
        marginBottom: '12px',
        boxSizing: 'border-box'
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        marginTop: '16px'
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
    }
};

/**
 * コミュニケーションスペースを追加するためのモーダルコンポーネント
 * 
 * @param {Object} props - コンポーネントのプロップス
 * @param {boolean} props.isOpen - モーダルの表示状態
 * @param {Function} props.onClose - モーダルを閉じる関数
 * @param {Function} props.onAdd - スペースを追加する関数
 */
const AddSpaceModal = ({ isOpen, onClose, onAdd }) => {
    const [spaceName, setSpaceName] = useState('');
    const [spaceDescription, setSpaceDescription] = useState('');
    const [spaceOptions, setSpaceOptions] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (spaceName.trim() && !isSubmitting) {
            setIsSubmitting(true);

            try {
                await onAdd({
                    id: Math.floor(Date.now() / 1000), // 整数型IDを生成（実際はサーバーから返されるIDを使用）
                    name: spaceName,
                    description: spaceDescription,
                    options: spaceOptions || `#space-${Math.floor(Date.now() / 1000)}`
                });

                // フォームをリセット
                setSpaceName('');
                setSpaceDescription('');
                setSpaceOptions('');
                onClose();
            } catch (error) {
                console.error('スペース追加エラー:', error);
                // TODO: エラーメッセージを表示する
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setSpaceName('');
            setSpaceDescription('');
            setSpaceOptions('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div style={styles.modal} onClick={handleClose}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                    新しいコミュニケーションスペースを追加
                </h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '12px', color: '#374151', fontSize: '12px', flexDirection: 'column' }}>
                        <input
                            style={styles.input}
                            type="text"
                            placeholder="スペース名"
                            value={spaceName}
                            onChange={(e) => setSpaceName(e.target.value)}
                            disabled={isSubmitting}
                            required
                        />
                        <input
                            style={styles.input}
                            type="text"
                            placeholder="説明（任意）"
                            value={spaceDescription}
                            onChange={(e) => setSpaceDescription(e.target.value)}
                            disabled={isSubmitting}
                        />
                        <input
                            style={styles.input}
                            type="text"
                            placeholder="オプション（例：#hashtag）"
                            value={spaceOptions}
                            onChange={(e) => setSpaceOptions(e.target.value)}
                            disabled={isSubmitting}
                        />

                        <div style={styles.buttonContainer}>
                            <button
                                type="button"
                                style={styles.buttonSecondary}
                                onClick={handleClose}
                                disabled={isSubmitting}
                            >
                                キャンセル
                            </button>
                            <button
                                type="submit"
                                style={styles.button}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? '追加中...' : '追加'}
                            </button>
                        </div>

                    </div>

                </form>
            </div>
        </div>
    );
};

export default AddSpaceModal;