// useResponsiveSize.js
import { useEffect } from 'react';
import useSizeStore from '../../store/shared/sizeStore';

export default function useResponsiveSize() {
    const updateSize = useSizeStore((state) => state.updateSize);

    useEffect(() => {
        // 初回実行
        updateSize();

        // イベントリスナ登録
        window.addEventListener('resize', updateSize);

        // クリーンアップ
        return () => {
            window.removeEventListener('resize', updateSize);
        };
    }, [updateSize]);
}
