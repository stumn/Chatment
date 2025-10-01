import React from 'react';

/**
 * 再利用可能な基本モーダルコンポーネント
 * 
 * @param {Object} props - コンポーネントのプロップス
 * @param {boolean} props.isOpen - モーダルの表示状態
 * @param {Function} props.onClose - モーダルを閉じる関数
 * @param {string} props.title - モーダルのタイトル
 * @param {React.ReactNode} props.children - モーダルの内容
 * @param {string} props.maxWidth - モーダルの最大幅（デフォルト: 600px）
 * @param {boolean} props.isSubmitting - 送信中状態（オーバーレイクリック無効化用）
 */
const BaseModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = '600px',
  isSubmitting = false 
}) => {
  const handleOverlayClick = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]" 
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-white p-6 rounded-lg max-w-[90%] max-h-[90vh] overflow-y-auto" 
        style={{ width: maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
};

export default BaseModal;