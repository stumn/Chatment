import { useState } from 'react';
import useAppStore from '../../../store/spaces/appStore';
import usePostStore from '../../../store/spaces/postStore';
import { linkifyText } from '../../../utils/linkify';

const ChatRow = ({ data, index, style }) => {
    const cMsg = data.chatMessages[index];

    // アンケートかどうかをチェック
    const isPoll = cMsg.poll && cMsg.poll.question;

    // --- positive/negative人数 ---
    const positive = cMsg.positive || 0;
    const negative = cMsg.negative || 0;

    // カラフルモードの状態を取得
    const isColorfulMode = useAppStore((state) => state.isColorfulMode);
    const isCompactMode = useAppStore((state) => state.isCompactMode);

    // --- ホバー状態を管理 ---
    const [isHovered, setIsHovered] = useState(false);

    // --- ボタンが押されたかどうかを管理（1度だけ押せるように） ---
    const [hasVotedPositive, setHasVotedPositive] = useState(false);
    const [hasVotedNegative, setHasVotedNegative] = useState(false);

    // 見出し行判定（#で始まる行）
    const isHeading = cMsg.msg && cMsg.msg.trim().startsWith('#');

    // --- 文字サイズと色を⬆⬇の差で決定（差が大きいほど変化） ---
    const diff = positive - negative;
    let fontSize = 15 + diff * 2; // 差が1で17px、2で19px、-1で13pxなど
    if (fontSize > 30) fontSize = 30;
    if (fontSize < 10) fontSize = 10;

    // 見出しの場合はさらに大きく
    if (isHeading) {
        fontSize = Math.max(fontSize * 1.5, 22); // 見出しは最低でも22px
    }

    // --- 文字色を差に応じて決定（カラフルモードの場合のみ） ---
    let textColor = '#000'; // デフォルト色
    if (isColorfulMode) {
        if (diff > 0) {
            textColor = '#4CAF50'; // 緑色（ポジティブ）
        } else if (diff < 0) {
            textColor = '#F44336'; // 赤色（ネガティブ）
        }
    }

    // --- emitPositive/emitNegativeを取得 ---
    const addPositive = data.addPositive;
    const addNegative = data.addNegative;
    const votePoll = data.votePoll; // アンケート投票関数を取得

    const handlePositive = () => {
        if (!hasVotedPositive && addPositive) {
            addPositive(cMsg.id);
            setHasVotedPositive(true);
        }
    };
    const handleNegative = () => {
        if (!hasVotedNegative && addNegative) {
            addNegative(cMsg.id);
            setHasVotedNegative(true);
        }
    };

    // アンケート投票ハンドラー
    const handleVote = (optionIndex) => {
        if (votePoll && !usePostStore.getState().hasVoted(cMsg.id)) {
            votePoll(cMsg.id, optionIndex);
            usePostStore.getState().recordVote(cMsg.id, optionIndex);
        }
    };

    // ボタンの色クラス
    const positiveButtonClass = hasVotedPositive
        ? 'text-[#ccc]'
        : isColorfulMode
            ? 'text-[#4CAF50]'
            : 'text-[#888]';

    const negativeButtonClass = hasVotedNegative
        ? 'text-[#ccc]'
        : isColorfulMode
            ? 'text-[#F44336]'
            : 'text-[#888]';

    return (
        <div
            style={style}
            key={cMsg.order}
            className="relative border border-transparent border-b-[#eee] transition-all duration-200 bg-white py-1 px-4 pr-4 pl-1 hover:bg-[#f3f4f6] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] hover:border-[#e5e7eb]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="text-left text-[15px] ml-5">
                <strong className="font-bold">{cMsg.nickname}</strong>
                <span className="text-[#666] text-sm before:content-['\00A0\00A0']">{cMsg.time}</span>
            </div>

            {/* アンケート表示 */}
            {isPoll ? (
                <PollDisplay poll={cMsg.poll} postId={cMsg.id} onVote={handleVote} />
            ) : (
                /* 通常のメッセージ表示 */
                <div
                    className="text-left ml-10 relative flex-1 overflow-hidden"
                    style={{ fontSize }}
                >
                    <span
                        className="block outline-none border-none bg-transparent overflow-hidden whitespace-nowrap pr-8 relative"
                        style={{
                            fontSize,
                            color: textColor,
                            fontWeight: isHeading ? 'bold' : 'normal',
                        }}
                        title={cMsg.msg} // ホバーで全文表示
                    >
                        {linkifyText(cMsg.msg)}
                        {/* 右端にフェードアウトグラデーション */}
                        <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-r from-transparent via-white/50 to-white pointer-events-none" />
                    </span>
                    {/* positive/negativeボタン（見出し行以外で表示、コンパクトモード時はホバー時のみ表示） */}
                    {!isHeading && (
                        <div
                            className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 transition-opacity duration-200 h-full"
                            style={{ opacity: isCompactMode ? (isHovered ? 1 : 0) : 1 }}
                        >
                            <button
                                contentEditable={false}
                                className={`px-1 bg-white rounded-full shadow-md border transition-all duration-200 ${positiveButtonClass} ${!hasVotedPositive ? 'cursor-pointer hover:bg-gray-200 hover:scale-110' : 'cursor-not-allowed opacity-50'}`}
                                onClick={handlePositive}
                                disabled={hasVotedPositive}
                                title={`ポジティブ: ${positive}${hasVotedPositive ? ' (投票済み)' : ''}`}
                            >
                                ⬆
                            </button>
                            <button
                                contentEditable={false}
                                className={`px-1 bg-white rounded-full shadow-md border transition-all duration-200 ${negativeButtonClass} ${!hasVotedNegative ? 'cursor-pointer hover:bg-gray-200 hover:scale-110' : 'cursor-not-allowed opacity-50'}`}
                                onClick={handleNegative}
                                disabled={hasVotedNegative}
                                title={`ネガティブ: ${negative}${hasVotedNegative ? ' (投票済み)' : ''}`}
                            >
                                ⬇
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// 65px高さのシンプルなアンケート表示コンポーネント
const PollDisplay = ({ poll, postId, onVote }) => {
    const hasVoted = usePostStore((state) => state.hasVoted(postId));
    const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.voteCount || opt.votes?.length || 0), 0) || 0;

    return (
        <div className="ml-10 mr-4 flex items-center gap-2" style={{ height: '40px' }}>
            {/* 質問タイトル */}
            <div className="flex items-center gap-1 text-sm font-semibold text-gray-700 shrink-0">
                <span>📊</span>
                <span className="max-w-[200px] truncate">{poll.question}</span>
                {poll.isAnonymous && <span className="text-xs text-indigo-500">🔒</span>}
                <span className="text-xs text-gray-400">({totalVotes}票)</span>
            </div>

            {/* 選択肢ボタン（横スクロール可能） */}
            <div className="flex gap-1 overflow-x-auto flex-1">
                {poll.options?.map((opt, idx) => {
                    const voteCount = opt.voteCount || opt.votes?.length || 0;
                    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

                    return (
                        <button
                            key={idx}
                            onClick={() => onVote(idx)}
                            disabled={hasVoted}
                            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${hasVoted
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer'
                                }`}
                            title={`${opt.label}: ${voteCount}票 (${percentage}%)`}
                        >
                            {opt.label} {voteCount > 0 && `(${voteCount})`}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ChatRow;