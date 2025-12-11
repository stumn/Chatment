import React, { useState, useEffect } from 'react';
import FinishedSpacesSection from '../components/admin/FinishedSpacesSection';
import ActiveSpacesSection from '../components/admin/ActiveSpacesSection';
import SpaceMessageModal from '../components/admin/SpaceMessageModal';
import useSpaceStore from '../store/spaceStore';
import useResponsiveSize from '../hooks/shared/useResponsiveSize';
import sizeStore from '../store/sizeStore';

function SpaceApp() {
    // Zustandストアから状態とアクションを取得
    const activeSpaces = useSpaceStore(state => state.activeSpaces);
    const finishedSpaces = useSpaceStore(state => state.finishedSpaces);
    const isLoading = useSpaceStore(state => state.isLoading);
    const error = useSpaceStore(state => state.error);

    // アクション関数を取得
    const fetchAllSpaces = useSpaceStore(state => state.fetchAllSpaces);
    const addSpace = useSpaceStore(state => state.addSpace);
    const updateSpace = useSpaceStore(state => state.updateSpace);
    const finishSpace = useSpaceStore(state => state.finishSpace);
    const clearError = useSpaceStore(state => state.clearError);

    // ローカル状態（モーダル表示のため）
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSpace, setEditingSpace] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // カスタムフックでレスポンシブサイズを管理
    useResponsiveSize();

    const width = sizeStore((state) => state.width);

    // 初期化時にデータを取得
    useEffect(() => {
        const initializeStore = async () => {
            try {
                // 管理者用全スペース一覧を取得
                await fetchAllSpaces();
            } catch (error) {
                console.error('初期化エラー:', error);
            }
        };

        initializeStore();
    }, []);

    // コミュニケーションスペースを追加する関数
    const handleAddSpace = async (newSpace) => {
        try {
            await addSpace(newSpace);
            // モーダルを閉じる
            setIsAddModalOpen(false);
            setSuccessMessage('新しいスペースが作成されました');
            setTimeout(() => setSuccessMessage(''), 3000); // 3秒後に消去
        } catch (error) {
            console.error('スペース追加エラー:', error);
            // エラーが発生してもモーダルは閉じる（ユーザーが再試行できるよう）
        }
    };

    // コミュニケーションスペースを編集する関数
    const handleEditSpace = (space) => {
        setEditingSpace(space);
        setIsEditModalOpen(true);
    };

    // スペース更新処理
    const handleUpdateSpace = async (updatedSpace) => {
        try {
            await updateSpace(updatedSpace);
            // モーダルを閉じる
            setIsEditModalOpen(false);
            setEditingSpace(null);
            setSuccessMessage('スペースが更新されました');
            setTimeout(() => setSuccessMessage(''), 3000); // 3秒後に消去

            // スペース一覧を再取得
            await fetchAllSpaces();
        } catch (error) {
            console.error('スペース更新エラー:', error);
        }
    };

    // スペースを選択する関数
    const handleSelectSpace = (space) => {
        // 新しいタブでスペース詳細ページを開く（整数型スペースID対応）
        const spaceUrl = `/spaces/${space.id}`;
        window.open(spaceUrl, '_blank');
    };

    // スペースを終了する関数
    const handleFinishSpace = async (spaceId) => {
        try {
            await finishSpace(spaceId);
            setSuccessMessage('スペースが終了されました');
            setTimeout(() => setSuccessMessage(''), 3000); // 3秒後に消去
        } catch (error) {
            console.error('スペース終了エラー:', error);
        }
    };

    // 編集モーダルを閉じるハンドラー
    const handleEditModalClose = () => {
        setIsEditModalOpen(false);
        setEditingSpace(null);
    };

    return (
        <>
            <title>Chatment | スペース管理</title>
            <div className="font-system bg-white px-8 py-6 rounded-lg shadow-md max-w-4xl mx-auto my-6"
                style={{ width: `${width}px` }}>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Chatment スペース管理</h2>

                {/* メッセージ表示とモーダル管理 (SpaceMessageModal.jsx) */}
                <SpaceMessageModal
                    // メッセージ関連
                    successMessage={successMessage}
                    onSuccessMessageClose={() => setSuccessMessage('')}
                    error={error}
                    onErrorClear={clearError}
                    isLoading={isLoading}

                    // 追加モーダル関連
                    isAddModalOpen={isAddModalOpen}
                    onAddModalClose={() => setIsAddModalOpen(false)}
                    onAddSpace={handleAddSpace}

                    // 編集モーダル関連
                    isEditModalOpen={isEditModalOpen}
                    onEditModalClose={handleEditModalClose}
                    onUpdateSpace={handleUpdateSpace}
                    editingSpace={editingSpace}
                />


                {/* アクティブスペース一覧 */}
                <ActiveSpacesSection
                    activeSpaces={activeSpaces}
                    onSelectSpace={handleSelectSpace}
                    onFinishSpace={handleFinishSpace}
                    onEditSpace={handleEditSpace}
                    onAddSpaceClick={() => setIsAddModalOpen(true)}
                />

                {/* 終了スペース一覧 */}
                <FinishedSpacesSection finishedSpaces={finishedSpaces} />

                {/* フッター */}
                <div className="text-center text-gray-500 mt-8">
                    <hr className="my-4 border-gray-200" />
                    <p>© Mao NAKANO - Chatment </p>
                </div>
            </div>
        </>
    );
}

export default SpaceApp;
