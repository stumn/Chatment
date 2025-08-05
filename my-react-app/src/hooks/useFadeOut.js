// File: my-react-app/src/hooks/useFadeOut.js

import { useState, useRef, useEffect } from 'react';

/**
 * 変更バーのフェードアウト管理を行うカスタムフック
 * @param {Object} changeState - 変更状態オブジェクト
 * @param {boolean} isEditing - 編集中かどうか
 * @param {string} messageId - メッセージID
 * @param {Function} clearChangeState - 変更状態をクリアする関数
 * @returns {Object} フェードアウト関連の状態とハンドラー
 */
const useFadeOut = (changeState, isEditing, messageId, clearChangeState) => {
    // フェードアウト状態とホバー状態を管理
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const fadeTimeoutRef = useRef(null);

    // タイマー関連の定数
    const FADE_DELAY = 15000;      // 15秒後にフェードアウト開始
    const FADE_DURATION = 2000;    // 2秒でフェードアウト完了
    const HOVER_DELAY = 5000;      // ホバー終了後5秒でフェードアウト再開

    /**
     * タイマーをクリアする共通関数
     */
    const clearTimer = () => {
        if (fadeTimeoutRef.current) {
            clearTimeout(fadeTimeoutRef.current);
            fadeTimeoutRef.current = null;
        }
    };

    /**
     * フェードアウトを開始する共通関数
     * @param {number} delay - 開始までの遅延時間（ミリ秒）
     */
    const startFadeOut = (delay = FADE_DELAY) => {
        clearTimer();
        fadeTimeoutRef.current = setTimeout(() => {
            // 編集中やホバー中でなければフェードアウト開始
            if (!isEditing && !isHovering) {
                setIsFadingOut(true);
                
                // フェードアウト完了後に変更状態をクリア
                setTimeout(() => {
                    clearChangeState(messageId);
                    setIsFadingOut(false);
                }, FADE_DURATION);
            }
        }, delay);
    };

    // 変更状態の変化を監視してフェードアウトタイマーを制御
    useEffect(() => {
        // 変更状態があり、フェードアウト中でなく、編集中でない場合にタイマー開始
        if (changeState && !isFadingOut && !isEditing) {
            startFadeOut();
        }

        // 編集開始時はタイマーをクリアしてフェードアウトを停止
        if (isEditing) {
            clearTimer();
            setIsFadingOut(false);
        }

        // コンポーネントがアンマウントされる際のクリーンアップ
        return clearTimer;
    }, [changeState, isEditing, isFadingOut]);

    // ホバー状態の変化を監視
    useEffect(() => {
        if (isHovering && isFadingOut) {
            // ホバー中はフェードアウトを停止
            setIsFadingOut(false);
        } else if (!isHovering && changeState && !isEditing) {
            // ホバー終了時、変更状態があり編集中でなければタイマー再開
            startFadeOut(HOVER_DELAY);
        }
    }, [isHovering, changeState, isEditing]);

    // 編集終了時の処理
    useEffect(() => {
        // 編集終了後、変更状態があり、フェードアウト中でなく、ホバー中でなければタイマー再開
        if (!isEditing && changeState && !isFadingOut && !isHovering) {
            startFadeOut();
        }
    }, [isEditing, changeState, isFadingOut, isHovering]);

    /**
     * ホバー開始時のハンドラー
     */
    const handleMouseEnter = () => {
        setIsHovering(true);
    };

    /**
     * ホバー終了時のハンドラー
     */
    const handleMouseLeave = () => {
        setIsHovering(false);
    };

    return {
        isFadingOut,
        isHovering,
        handleMouseEnter,
        handleMouseLeave
    };
};

export default useFadeOut;
