import React from 'react';
import AddSpaceModal from './AddSpaceModal';
import EditSpaceModal from './EditSpaceModal';
/**
 * スペース管理画面のメッセージ表示とモーダル管理コンポーネント
 */
const SpaceMessageModal = ({
    // メッセージ関連
    successMessage,
    onSuccessMessageClose,
    error,
    onErrorClear,
    isLoading,

    // 追加モーダル関連
    isAddModalOpen,
    onAddModalClose,
    onAddSpace,

    // 編集モーダル関連
    isEditModalOpen,
    onEditModalClose,
    onUpdateSpace,
    editingSpace
}) => {
    return (
        <>
            {/* メッセージ表示 */}
            <SuccessMessage
                message={successMessage}
                onClose={onSuccessMessageClose}
            />

            <ErrorMessage
                message={error}
                onClose={onErrorClear}
            />

            <LoadingMessage
                show={isLoading}
                message="読み込み中..."
            />

            {/* スペース追加モーダル */}
            <AddSpaceModal
                isOpen={isAddModalOpen}
                onClose={onAddModalClose}
                onAdd={onAddSpace}
            />

            {/* スペース編集モーダル */}
            <EditSpaceModal
                isOpen={isEditModalOpen}
                onClose={onEditModalClose}
                onUpdate={onUpdateSpace}
                space={editingSpace}
            />
        </>
    );
};

export default SpaceMessageModal;

const AlertMessage = ({ type, message, onClose, closable = true }) => {
    // タイプ別のスタイル定義
    const getAlertStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-green-50 border-green-300 text-green-700';
            case 'error':
                return 'bg-red-50 border-red-300 text-red-700';
            case 'info':
                return 'bg-blue-50 border-blue-300 text-blue-700';
            case 'warning':
                return 'bg-yellow-50 border-yellow-300 text-yellow-700';
            default:
                return 'bg-gray-50 border-gray-300 text-gray-700';
        }
    };

    // クローズボタンのホバースタイル
    const getCloseButtonHoverStyle = () => {
        switch (type) {
            case 'success':
                return 'hover:text-green-800';
            case 'error':
                return 'hover:text-red-800';
            case 'info':
                return 'hover:text-blue-800';
            case 'warning':
                return 'hover:text-yellow-800';
            default:
                return 'hover:text-gray-800';
        }
    };

    if (!message) return null;

    return (
        <div className={`p-3 border rounded mb-4 ${getAlertStyles()} ${closable ? 'flex justify-between items-center' : ''}`}>
            <span className={closable ? '' : 'block'}>{message}</span>
            {closable && onClose && (
                <button
                    onClick={onClose}
                    className={`bg-transparent border-none cursor-pointer text-base ml-4 ${getAlertStyles().split(' ').find(cls => cls.startsWith('text-'))} ${getCloseButtonHoverStyle()}`}
                >
                    ×
                </button>
            )}
        </div>
    );
};

/**
 * ローディングメッセージコンポーネント
 */
export const LoadingMessage = ({ message = '読み込み中...', show = true }) => {
    if (!show) return null;

    return (
        <AlertMessage
            type="info"
            message={message}
            closable={false}
        />
    );
};

/**
 * 成功メッセージコンポーネント
 */
export const SuccessMessage = ({ message, onClose }) => {
    return (
        <AlertMessage
            type="success"
            message={message}
            onClose={onClose}
            closable={true}
        />
    );
};

/**
 * エラーメッセージコンポーネント
 */
export const ErrorMessage = ({ message, onClose }) => {
    return (
        <AlertMessage
            type="error"
            message={message}
            onClose={onClose}
            closable={true}
        />
    );
};
