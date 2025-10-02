import React from 'react';
import AddSpaceModal from '../../components/admin/AddSpaceModal';
import EditSpaceModal from '../../components/admin/EditSpaceModal';
import SpaceStatistics from '../../components/admin/SpaceStatistics';
import { LoadingMessage, SuccessMessage, ErrorMessage } from '../../components/shared/AlertMessage';

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
  
  // 統計情報関連（将来的に使用）
  activeSpaces,
  finishedSpaces,
  
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
      {/* 統計情報表示 */}
      {/* 
      <SpaceStatistics 
        activeSpaces={activeSpaces}
        finishedSpaces={finishedSpaces}
      /> 
      */}

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
