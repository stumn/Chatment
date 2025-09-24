import React, { useState } from 'react';

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
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]" 
            onClick={handleClose}
        >
            <div 
                className="bg-white p-6 rounded-lg w-96 max-w-[90%]" 
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="mb-4 text-lg font-semibold">
                    新しいコミュニケーションスペースを追加
                </h3>
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
                        <input
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-3 box-border disabled:bg-gray-100 disabled:cursor-not-allowed"
                            type="text"
                            placeholder="説明（任意）"
                            value={spaceDescription}
                            onChange={(e) => setSpaceDescription(e.target.value)}
                            disabled={isSubmitting}
                        />
                        <input
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-3 box-border disabled:bg-gray-100 disabled:cursor-not-allowed"
                            type="text"
                            placeholder="オプション（例：#hashtag）"
                            value={spaceOptions}
                            onChange={(e) => setSpaceOptions(e.target.value)}
                            disabled={isSubmitting}
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
                                type="submit"
                                className="px-4 py-2 !bg-blue-500 text-white border-none rounded text-sm font-medium cursor-pointer mr-2 hover:!bg-blue-600 disabled:!bg-blue-300 disabled:cursor-not-allowed transition-colors duration-150"
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