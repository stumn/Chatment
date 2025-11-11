import React, { useState } from 'react';
import BaseModal from './ui/BaseModal';
import SubRoomSettings from './SubRoomSettings';

/**
 * コミュニケーションスペースを編集するためのモーダルコンポーネント
 * 
 * @param {Object} props - コンポーネントのプロップス
 * @param {boolean} props.isOpen - モーダルの表示状態
 * @param {Function} props.onClose - モーダルを閉じる関数
 * @param {Function} props.onUpdate - スペースを更新する関数
 * @param {Object} props.space - 編集対象のスペースデータ
 */
const EditSpaceModal = ({ isOpen, onClose, onUpdate, space }) => {
    const [spaceName, setSpaceName] = useState(space?.name || '');
    const [subRoomSettings, setSubRoomSettings] = useState(
        space?.subRoomSettings || space?.settings?.subRoomSettings || {
            enabled: false,
            rooms: [{ name: '全体' }]
        }
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    // spaceが変更された時に状態を更新
    React.useEffect(() => {
        if (space) {
            setSpaceName(space.name || '');
            setSubRoomSettings(space.subRoomSettings || space.settings?.subRoomSettings || {
                enabled: false,
                rooms: [{ name: '全体' }]
            });
        }
    }, [space]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (spaceName.trim() && !isSubmitting && space) {
            setIsSubmitting(true);

            try {
                await onUpdate({
                    id: space.id,
                    name: spaceName,
                    subRoomSettings: subRoomSettings
                });

                onClose();
            } catch (error) {
                console.error('スペース更新エラー:', error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            // フォームをリセット
            if (space) {
                setSpaceName(space.name || '');
                setSubRoomSettings(space.subRoomSettings || {
                    enabled: false,
                    rooms: [{ name: '全体' }]
                });
            }
            onClose();
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            title="コミュニケーションスペースを編集"
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

                    {/* サブルーム設定（読み取り専用モード） */}
                    <SubRoomSettings
                        subRoomSettings={subRoomSettings}
                        onChange={setSubRoomSettings}
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
                            {isSubmitting ? '更新中...' : '更新'}
                        </button>
                    </div>
                </div>
            </form>
        </BaseModal>
    );
};

export default EditSpaceModal;