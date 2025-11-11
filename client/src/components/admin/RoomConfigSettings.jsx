import React, { useState, useEffect } from 'react';

/**
 * ルーム設定UI コンポーネント
 * 
 * 【新スキーマ roomConfig に完全移行】
 * - 旧 subRoomSettings を完全廃止
 * - roomConfig { mode: 'single'|'multi', rooms: [{name, isDefault}] } のみを扱う
 * 
 * @param {Object} props - コンポーネントのプロップス
 * @param {Object} props.roomConfig - 現在のルーム設定 { mode: 'single'|'multi', rooms: [{name, isDefault}] }
 * @param {Function} props.onChange - 設定変更時のコールバック
 * @param {boolean} props.readOnlyMode - 読み取り専用モード（既存ルーム名変更不可）
 */
const RoomConfigSettings = ({ roomConfig, onChange, readOnlyMode = false }) => {
    const [mode, setMode] = useState(roomConfig?.mode || 'single');
    const [mainRoomName, setMainRoomName] = useState('');
    const [subRoomsText, setSubRoomsText] = useState('');

    // 初期値設定 - roomConfig から UI 状態を構築
    useEffect(() => {
        if (roomConfig?.rooms && roomConfig.rooms.length > 0) {
            const rooms = roomConfig.rooms;
            // デフォルトルーム（isDefault: true）または最初のルームを「全体」として扱う
            const defaultRoom = rooms.find(r => r.isDefault) || rooms[0];
            setMainRoomName(defaultRoom?.name || '全体');

            // 残りのルームをテキストエリア用文字列に変換
            const subRoomNames = rooms
                .filter(r => r.name !== defaultRoom.name)
                .map(room => room.name)
                .join('\n');
            setSubRoomsText(subRoomNames);

            setMode(roomConfig.mode || (rooms.length > 1 ? 'multi' : 'single'));
        } else {
            // roomConfig が未設定の場合のデフォルト値
            setMainRoomName('全体');
            setSubRoomsText('');
            setMode('single');
        }
    }, [roomConfig]);

    // テキストエリアから roomConfig.rooms 配列を生成
    const parseRoomsFromText = (mainName, subText) => {
        const rooms = [{ name: mainName, isDefault: true }];

        if (subText.trim()) {
            const subRoomNames = subText
                .split('\n')
                .map(name => name.trim())
                .filter(name => name.length > 0);

            subRoomNames.forEach(name => {
                rooms.push({ name: name, isDefault: false });
            });
        }

        return rooms;
    };

    // 設定変更を親コンポーネントに通知 - roomConfig 形式で返す
    const notifyChange = (newMode, newMainName, newSubText) => {
        const rooms = parseRoomsFromText(newMainName, newSubText);
        const newRoomConfig = {
            mode: newMode,
            rooms: rooms
        };
        onChange(newRoomConfig);
    };

    // マルチルームモードの有効/無効切り替え
    const handleModeChange = (newMode) => {
        setMode(newMode);
        notifyChange(newMode, mainRoomName, subRoomsText);
    };

    // 全体ルーム名変更
    const handleMainRoomNameChange = (newName) => {
        setMainRoomName(newName);
        notifyChange(mode, newName, subRoomsText);
    };

    // サブルームテキスト変更
    const handleSubRoomsTextChange = (newText) => {
        setSubRoomsText(newText);
        notifyChange(mode, mainRoomName, newText);
    };

    // 新規ルーム追加（編集モード専用）
    const handleNewRoomsChange = (newRoomsText) => {
        // 既存のサブルームと新規ルームを結合
        const combinedText = subRoomsText + (subRoomsText && newRoomsText ? '\n' : '') + newRoomsText;
        setSubRoomsText(combinedText);
        notifyChange(mode, mainRoomName, combinedText);
    };

    // 現在のルーム数を計算
    const currentRoomCount = parseRoomsFromText(mainRoomName, subRoomsText).length;

    return (
        <div className="p-4 ">
            <div className="flex items-center mb-3">
                <span className="text-sm font-semibold text-gray-700 mr-3 mb-0">
                    詳細設定
                </span>
            </div>

            {/* マルチルームモードの有効/無効 */}
            <div className="mb-4 text-left">
                <label className="items-center text-sm text-gray-600">
                    <input
                        type="checkbox"
                        checked={mode === 'multi'}
                        onChange={(e) => handleModeChange(e.target.checked ? 'multi' : 'single')}
                        className="mr-2"
                    />
                    サブルーム機能を有効にする
                </label>
                <p className="text-xs text-gray-500 mt-1 text-left">
                    {mode === 'multi'
                        ? 'チャットが複数のルームに分かれます'
                        : '全体ルームのみでチャットを行います'
                    }
                </p>
            </div>

            {/* マルチルーム有効時の設定 */}
            {mode === 'multi' && (
                <div className="space-y-4 text-left">
                    {/* 全体ルーム名設定 */}
                    <div className="items-center">
                        <label className="block text-sm text-gray-600 mb-2">
                            メインルーム（すべての投稿が表示される通常チャット）
                            {readOnlyMode && <span className="text-xs text-orange-600 ml-2">※編集時は変更不可</span>}
                        </label>
                        <textarea
                            required
                            value={mainRoomName}
                            onChange={(e) => handleMainRoomNameChange(e.target.value)}
                            maxLength={10}
                            className={`w-full text-sm p-2 border border-gray-300 rounded focus:border-blue-500 text-left ${readOnlyMode ? 'bg-gray-100 cursor-not-allowed' : ''
                                }`}
                            placeholder={mainRoomName || '全体'}
                            rows={1}
                            disabled={readOnlyMode}
                        />
                    </div>

                    {/* 既存ルーム一覧（編集モード時のみ表示） */}
                    {readOnlyMode && subRoomsText && (
                        <div className="text-left">
                            <label className="block text-sm text-gray-600 mb-2 text-left">
                                既存のサブルーム
                                <span className="text-xs text-orange-600 ml-2">※編集時は変更不可</span>
                            </label>
                            <div className="w-full text-sm p-2 border border-gray-200 rounded bg-gray-50 text-left">
                                {subRoomsText.split('\n').filter(name => name.trim()).map((roomName, index) => (
                                    <div key={index} className="py-1 text-gray-700">
                                        {roomName.trim()}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* サブルーム設定 */}
                    <div className="text-left">
                        <label className="block text-sm text-gray-600 mb-2 text-left">
                            {readOnlyMode ? '新規サブルーム（追加のみ可能）' : 'サブルーム（改行区切りで入力）'}
                        </label>
                        <textarea
                            required
                            value={readOnlyMode ? '' : subRoomsText}
                            onChange={(e) => readOnlyMode ? handleNewRoomsChange(e.target.value) : handleSubRoomsTextChange(e.target.value)}
                            rows={readOnlyMode ? 3 : 6}
                            className="w-full text-sm p-2 border border-gray-300 rounded focus:border-blue-500 text-left"
                            placeholder={readOnlyMode
                                ? `新しいルーム1\n新しいルーム2\n\n（既存ルームは変更できません）`
                                : `雑談\n質問・相談\nお知らせ\n\n（1行につき1つのルームとして作成されます）`
                            }
                            style={{
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'inherit',
                                lineHeight: '1.4'
                            }}
                            spellCheck={false}
                            autoComplete="off"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1 text-left">
                            <span>
                                {readOnlyMode
                                    ? '💡 新規ルームのみ追加可能、既存ルームは変更できません'
                                    : '💡 Enterキーで改行、各行が1つのルームになります'
                                }
                            </span>
                            <span>
                                {currentRoomCount}ルーム
                            </span>
                        </div>
                    </div>

                    {/* バリデーション警告 */}
                    <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded p-2 text-left">
                        <p className="font-medium text-left">サブルーム名の注意:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-left">
                            <li className="text-left">ルーム名は1-10文字で入力</li>
                            <li className="text-left">禁止文字: / \ &lt; &gt; " ' &amp;</li>
                            <li className="text-left">予約語: admin, system, api</li>
                            <li className="text-left">空行は無視されます</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomConfigSettings;
