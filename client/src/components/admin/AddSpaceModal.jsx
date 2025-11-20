import React, { useState } from 'react';
import BaseModal from './ui/BaseModal';

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
                    options: spaceOptions || `#space-${Math.floor(Date.now() / 1000)}`
                    // subRoomSettingsは廃止（常に1つの"全体"ルームのみ）
                });

                // フォームをリセット
                setSpaceName('');
                setSpaceOptions('');
                onClose();
            } catch (error) {
                console.error('スペース追加エラー:', error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setSpaceName('');
            setSpaceOptions('');
            onClose();
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            title="新しいコミュニケーションスペースを追加"
            maxWidth="600px"
            isSubmitting={isSubmitting}
        >
            <form onSubmit={handleSubmit}>
                <div className="mb-3 text-gray-700 text-xs flex-col">
                    <input
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-3 box-border disabled:bg-gray-100 disabled:cursor-not-allowed"
                        type="text"
                        placeholder="スペース名"
                        value={spaceName}
                        onChange={(e) => setSpaceName(e.target.value)}
                        disabled={isSubmitting}
                        required
                    />

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            className="px-4 py-2 !bg-gray-500 text-white border-none rounded text-sm font-medium cursor-pointer mr-2 hover:!bg-gray-600 disabled:!bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            キャンセル
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="px-4 py-2 !bg-blue-500 text-white border-none rounded text-sm font-medium cursor-pointer mr-2 hover:!bg-blue-600 disabled:!bg-blue-300 disabled:cursor-not-allowed transition-colors duration-150"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '追加中...' : '追加'}
                        </button>
                    </div>

                </div>

            </form>
        </BaseModal>
    );
};

export default AddSpaceModal;