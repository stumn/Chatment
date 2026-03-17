import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

/**
 * ログ分析ページコンポーネント
 * URL形式: /log-analysis/:spaceId
 */
const LogAnalysisPage = () => {
    const { spaceId } = useParams();
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('summary');
    const [selectedActions, setSelectedActions] = useState([]); // アクション絞り込み用（空配列=全表示）
    const [selectedUsers, setSelectedUsers] = useState([]); // ユーザ絞り込み用（空配列=全表示）
    const [selectedDateRange, setSelectedDateRange] = useState({ start: null, end: null }); // 期間絞り込み用
    const [showCalendar, setShowCalendar] = useState(null); // 'start' | 'end' | null
    const [calendarMonth, setCalendarMonth] = useState(new Date()); // カレンダーで表示中の月

    useEffect(() => {
        // タイトルを設定
        document.title = 'Chatment｜ログ分析';

        if (spaceId) {
            fetchLogAnalysis();
        }
    }, [spaceId]);

    const fetchLogAnalysis = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/spaces/${spaceId}/log-analysis`);
            const data = await response.json();

            if (data.success) {
                setAnalysis(data);
            } else {
                setError(data.error || 'ログ分析に失敗しました');
            }
        } catch (err) {
            console.error('Log analysis error:', err);
            setError('ログ分析データの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '不明';
        const date = new Date(dateString);
        return date.toLocaleString('ja-JP');
    };

    const formatDateShort = (dateString) => {
        if (!dateString) return '不明';
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP') + ' ' + date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    };

    const handleClose = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.close();
        }
    };

    // アクション名をクリックして全ログ一覧に遷移＋フィルター
    const handleActionClick = (actionName) => {
        setSelectedActions([actionName]);
        setSelectedUsers([]); // アクション絞り込みを設定する際はユーザ絞り込みをクリア
        setActiveTab('all');
    };

    // ユーザ名をクリックして全ログ一覧に遷移＋フィルター
    const handleUserClick = (userName) => {
        setSelectedUsers([userName]);
        setSelectedActions([]); // ユーザ絞り込みを設定する際はアクション絞り込みをクリア
        setActiveTab('all');
    };

    // アクションフィルターのトグル
    const toggleActionFilter = (actionName) => {
        setSelectedActions(prev => {
            if (prev.includes(actionName)) {
                return prev.filter(a => a !== actionName);
            } else {
                return [...prev, actionName];
            }
        });
    };

    // ユーザフィルターのトグル
    const toggleUserFilter = (userName) => {
        setSelectedUsers(prev => {
            if (prev.includes(userName)) {
                return prev.filter(u => u !== userName);
            } else {
                return [...prev, userName];
            }
        });
    };

    // 日付ごとのログ件数を計算（カレンダー表示用）
    const dailyLogCounts = useMemo(() => {
        if (!analysis?.allLogs) return {};
        const counts = {};
        analysis.allLogs.forEach(log => {
            const timestamp = log.timestamp || log.createdAt;
            if (!timestamp) return;
            const date = new Date(timestamp);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            counts[dateStr] = (counts[dateStr] || 0) + 1;
        });
        return counts;
    }, [analysis]);

    // カレンダーで日付を選択
    const handleDateClick = (dateStr) => {
        if (!dateStr || !showCalendar) return;

        if (showCalendar === 'start') {
            setSelectedDateRange(prev => ({ ...prev, start: dateStr }));
            setShowCalendar(null);
        } else if (showCalendar === 'end') {
            setSelectedDateRange(prev => ({ ...prev, end: dateStr }));
            setShowCalendar(null);
        }
    };

    // カレンダーの月を変更
    const changeCalendarMonth = (delta) => {
        setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    // カレンダーの日付配列を生成
    const calendarDays = useMemo(() => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push({ date: null });
        for (let i = 1; i <= lastDate; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({
                day: i,
                dateStr,
                count: dailyLogCounts[dateStr] || 0
            });
        }
        return days;
    }, [calendarMonth, dailyLogCounts]);

    // 期間絞り込みをクリア
    const clearDateRange = () => {
        setSelectedDateRange({ start: null, end: null });
    };

    // 全てのアクションを選択/解除
    const toggleAllActions = () => {
        if (!analysis?.actionStats) return;
        const allActionNames = Object.keys(analysis.actionStats);
        if (selectedActions.length === allActionNames.length) {
            setSelectedActions([]);
        } else {
            setSelectedActions(allActionNames);
        }
    };

    // 全てのユーザを選択/解除
    const toggleAllUsers = () => {
        if (!analysis?.userStats) return;
        const allUserNames = Object.keys(analysis.userStats);
        if (selectedUsers.length === allUserNames.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(allUserNames);
        }
    };

    const renderSummary = () => {
        if (!analysis?.summary) return null;
        const { summary } = analysis;

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded">
                        <div className="text-sm text-gray-600">総ログ数</div>
                        <div className="text-2xl font-bold text-blue-600">{summary.totalLogs.toLocaleString()}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                        <div className="text-sm text-gray-600">ユーザー数</div>
                        <div className="text-2xl font-bold text-green-600">{summary.totalUsers}</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded">
                        <div className="text-sm text-gray-600">アクション種類</div>
                        <div className="text-2xl font-bold text-purple-600">{summary.totalActions}</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded">
                        <div className="text-sm text-gray-600">記録期間</div>
                        <div className="text-sm font-semibold text-orange-600 mt-1">
                            {summary.timeRange.start ? formatDateShort(summary.timeRange.start) : '不明'}
                            <div className="text-xs">〜</div>
                            {summary.timeRange.end ? formatDateShort(summary.timeRange.end) : '不明'}
                        </div>
                    </div>
                </div>

                {summary.mostActiveUser && (
                    <div className="bg-gray-50 p-4 rounded">
                        <div className="text-sm font-semibold text-gray-700">最も活発なユーザー</div>
                        <div className="mt-2">
                            <span className="text-lg font-bold text-gray-900">{summary.mostActiveUser.user}</span>
                            <span className="ml-2 text-sm text-gray-600">
                                ({summary.mostActiveUser.stats.totalActions}回のアクション)
                            </span>
                        </div>
                    </div>
                )}

                {summary.mostCommonAction && (
                    <div className="bg-gray-50 p-4 rounded">
                        <div className="text-sm font-semibold text-gray-700">最も多いアクション</div>
                        <div className="mt-2">
                            <span className="text-lg font-bold text-gray-900">{summary.mostCommonAction.action}</span>
                            <span className="ml-2 text-sm text-gray-600">
                                ({summary.mostCommonAction.stats.count.toLocaleString()}回)
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderActions = () => {
        if (!analysis?.actionStats) return null;
        const actions = Object.entries(analysis.actionStats)
            .sort((a, b) => b[1].count - a[1].count);

        return (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b">アクション</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b">回数</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b">初回</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b">最終</th>
                        </tr>
                    </thead>
                    <tbody>
                        {actions.map(([action, stats]) => (
                            <tr key={action} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm font-medium border-b">
                                    <button
                                        onClick={() => handleActionClick(action)}
                                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                                    >
                                        {action}
                                    </button>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600 border-b">{stats.count.toLocaleString()}</td>
                                <td className="px-4 py-2 text-sm text-gray-600 border-b">{formatDateShort(stats.firstOccurrence)}</td>
                                <td className="px-4 py-2 text-sm text-gray-600 border-b">{formatDateShort(stats.lastOccurrence)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderUsers = () => {
        if (!analysis?.userStats) return null;
        const users = Object.entries(analysis.userStats)
            .sort((a, b) => b[1].totalActions - a[1].totalActions);

        return (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b">ユーザー</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b">総アクション数</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b">初回活動</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b">最終活動</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(([user, stats]) => (
                            <tr key={user} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm font-medium border-b">
                                    <button
                                        onClick={() => handleUserClick(user)}
                                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                                    >
                                        {user}
                                    </button>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600 border-b">{stats.totalActions.toLocaleString()}</td>
                                <td className="px-4 py-2 text-sm text-gray-600 border-b">{formatDateShort(stats.firstSeen)}</td>
                                <td className="px-4 py-2 text-sm text-gray-600 border-b">{formatDateShort(stats.lastSeen)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderTimeline = () => {
        if (!analysis?.timeline || analysis.timeline.length === 0) {
            return <div className="text-center text-gray-500 py-4">タイムラインデータがありません</div>;
        }

        const maxCount = Math.max(...analysis.timeline.map(t => t.totalCount));
        const graphHeight = 300;
        const graphWidth = Math.max(800, analysis.timeline.length * 60);
        const padding = { top: 20, right: 20, bottom: 60, left: 50 };
        const chartHeight = graphHeight - padding.top - padding.bottom;
        const chartWidth = graphWidth - padding.left - padding.right;

        // データポイントの計算
        const points = analysis.timeline.map((item, index) => {
            const x = padding.left + (index / (analysis.timeline.length - 1)) * chartWidth;
            const y = padding.top + chartHeight - (item.totalCount / maxCount) * chartHeight;
            return { x, y, count: item.totalCount, timestamp: item.timestamp, index };
        });

        // 折れ線のパスを生成
        const linePath = points.map((point, index) =>
            `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
        ).join(' ');

        // エリアのパスを生成（折れ線の下を塗りつぶす）
        const areaPath = `M ${padding.left} ${padding.top + chartHeight} L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L ${padding.left + chartWidth} ${padding.top + chartHeight} Z`;

        return (
            <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                    時間ごとのアクティビティ（15分単位）
                </div>
                <div className="overflow-x-auto">
                    <svg width={graphWidth} height={graphHeight} className="bg-white rounded border border-gray-200">
                        {/* グリッド線（横） */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                            const y = padding.top + chartHeight * (1 - ratio);
                            const value = Math.round(maxCount * ratio);
                            return (
                                <g key={i}>
                                    <line
                                        x1={padding.left}
                                        y1={y}
                                        x2={padding.left + chartWidth}
                                        y2={y}
                                        stroke="#e5e7eb"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x={padding.left - 10}
                                        y={y}
                                        textAnchor="end"
                                        alignmentBaseline="middle"
                                        className="text-xs fill-gray-500"
                                    >
                                        {value}
                                    </text>
                                </g>
                            );
                        })}

                        {/* エリア（塗りつぶし） */}
                        <path
                            d={areaPath}
                            fill="rgba(59, 130, 246, 0.1)"
                        />

                        {/* 折れ線 */}
                        <path
                            d={linePath}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                        />

                        {/* データポイント */}
                        {points.map((point, index) => (
                            <g key={index}>
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="4"
                                    fill="#3b82f6"
                                    className="cursor-pointer hover:r-6"
                                />
                                <title>{`${formatDateShort(point.timestamp)}: ${point.count}件`}</title>
                            </g>
                        ))}

                        {/* X軸のラベル */}
                        {points.filter((_, i) => i % Math.ceil(points.length / 10) === 0).map((point, index) => (
                            <text
                                key={index}
                                x={point.x}
                                y={padding.top + chartHeight + 20}
                                textAnchor="middle"
                                className="text-xs fill-gray-500"
                                transform={`rotate(-45, ${point.x}, ${padding.top + chartHeight + 20})`}
                            >
                                {formatDateShort(point.timestamp)}
                            </text>
                        ))}
                    </svg>
                </div>
            </div>
        );
    };

    const renderRecentLogs = () => {
        if (!analysis?.recentLogs || analysis.recentLogs.length === 0) {
            return <div className="text-center text-gray-500 py-4">最近のログがありません</div>;
        }

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">最新100件のログ（新しい順）</div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-3 h-3 rounded bg-blue-50 border border-blue-200"></span>
                            ユーザー操作
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-3 h-3 rounded bg-gray-100 border border-gray-300"></span>
                            システム処理
                        </span>
                    </div>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                    {analysis.recentLogs.map((log, index) => (
                        <div key={index} className={`p-3 rounded mb-2 text-sm border ${log.source === 'client' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                            }`}>
                            <div className="flex items-start justify-between mb-1">
                                <span className="font-medium text-gray-900">{log.action || 'unknown'}</span>
                                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                    <span className="text-xs text-gray-500">
                                        {formatDate(log.timestamp || log.createdAt)}
                                    </span>
                                    {log.level && (
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${log.level === 'error' ? 'bg-red-100 text-red-700' :
                                            log.level === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                                log.level === 'debug' ? 'bg-gray-100 text-gray-600' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {log.level}
                                        </span>
                                    )}
                                    {log.source && (
                                        <span className="text-xs text-gray-400">({log.source})</span>
                                    )}
                                </div>
                            </div>
                            {log.userNickname && (
                                <div className="text-xs text-gray-600 mb-1">
                                    <span className="font-medium">ユーザー:</span> {log.userNickname}
                                </div>
                            )}
                            {log.detail && Object.keys(log.detail).length > 0 && (
                                <div className="text-xs text-gray-600 mt-1">
                                    {log.detail.msgPreview && (
                                        <div className="mb-1 px-2 py-1 bg-white border-l-2 border-gray-300 text-gray-700 italic">
                                            "{log.detail.msgPreview}"
                                        </div>
                                    )}
                                    {Object.entries(log.detail).map(([key, value]) => {
                                        if (['roomId', 'spaceId', 'msgPreview', 'nickname', 'userSocketId'].includes(key)) return null;
                                        if (key === 'newMsg') return (
                                            <div key={key} className="mb-1 px-2 py-1 bg-white border-l-2 border-blue-300 text-gray-700 italic">
                                                → "{typeof value === 'string' && value.length > 40 ? value.substring(0, 40) + '...' : value}"
                                            </div>
                                        );
                                        return (
                                            <div key={key}>
                                                <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderAllLogs = () => {
        if (!analysis?.allLogs || analysis.allLogs.length === 0) {
            return <div className="text-center text-gray-500 py-4">ログがありません</div>;
        }

        // アクション一覧を取得（actionStatsから）
        const allActionNames = analysis.actionStats ? Object.keys(analysis.actionStats).sort() : [];

        // ユーザ一覧を取得（userStatsから）
        const allUserNames = analysis.userStats ? Object.keys(analysis.userStats).sort() : [];

        // フィルタリングされたログ（アクション、ユーザ、期間で絞り込み）
        let filteredLogs = analysis.allLogs;

        // アクション絞り込み
        if (selectedActions.length > 0) {
            filteredLogs = filteredLogs.filter(log => selectedActions.includes(log.action || 'unknown'));
        }

        // ユーザ絞り込み
        if (selectedUsers.length > 0) {
            filteredLogs = filteredLogs.filter(log => {
                const logUser = log.userNickname || log.detail?.user || log.detail?.nickname || 'unknown';
                return selectedUsers.includes(logUser);
            });
        }

        // 期間絞り込み
        if (selectedDateRange.start || selectedDateRange.end) {
            filteredLogs = filteredLogs.filter(log => {
                const timestamp = log.timestamp || log.createdAt;
                if (!timestamp) return false;
                const logDate = new Date(timestamp);
                const logDateStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;

                if (selectedDateRange.start && logDateStr < selectedDateRange.start) return false;
                if (selectedDateRange.end && logDateStr > selectedDateRange.end) return false;
                return true;
            });
        }

        return (
            <div className="flex gap-4">
                {/* 左側：絞り込みメニュー */}
                <div className="w-64 flex-shrink-0 space-y-4">
                    {/* 期間絞り込み */}
                    <div className="bg-gray-50 p-4 rounded border border-gray-200 sticky top-0">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 text-sm">期間絞り込み</h3>
                            {(selectedDateRange.start || selectedDateRange.end) && (
                                <button
                                    onClick={clearDateRange}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    クリア
                                </button>
                            )}
                        </div>

                        <div className="space-y-2 relative">
                            {/* 開始日 */}
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">開始日</label>
                                <button
                                    onClick={() => {
                                        setShowCalendar(showCalendar === 'start' ? null : 'start');
                                        if (showCalendar !== 'start') {
                                            // カレンダーを開く際、選択済みの日付がある場合はその月を表示
                                            if (selectedDateRange.start) {
                                                const [year, month] = selectedDateRange.start.split('-');
                                                setCalendarMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
                                            }
                                        }
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white hover:border-blue-500 text-left"
                                >
                                    {selectedDateRange.start || '日付を選択'}
                                </button>
                            </div>

                            {/* 終了日 */}
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">終了日</label>
                                <button
                                    onClick={() => {
                                        setShowCalendar(showCalendar === 'end' ? null : 'end');
                                        if (showCalendar !== 'end') {
                                            if (selectedDateRange.end) {
                                                const [year, month] = selectedDateRange.end.split('-');
                                                setCalendarMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
                                            }
                                        }
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white hover:border-blue-500 text-left"
                                >
                                    {selectedDateRange.end || '日付を選択'}
                                </button>
                            </div>

                            {/* カレンダーUI */}
                            {showCalendar && (
                                <div className="absolute left-0 top-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-[9999] w-80">
                                    {/* カレンダーヘッダー */}
                                    <div className="bg-gray-100 p-3 flex items-center justify-between border-b-2 border-gray-200">
                                        <button
                                            onClick={() => changeCalendarMonth(-1)}
                                            className="hover:bg-gray-200 p-1 rounded"
                                        >
                                            ←
                                        </button>
                                        <span className="font-bold text-gray-700">
                                            {calendarMonth.getFullYear()} / {calendarMonth.getMonth() + 1}
                                        </span>
                                        <button
                                            onClick={() => changeCalendarMonth(1)}
                                            className="hover:bg-gray-200 p-1 rounded"
                                        >
                                            →
                                        </button>
                                    </div>

                                    {/* 曜日ヘッダー */}
                                    <div className="grid grid-cols-7 bg-gray-50 text-xs font-bold text-gray-400 border-b border-gray-200">
                                        {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                                            <div key={d} className="py-2 text-center">{d}</div>
                                        ))}
                                    </div>

                                    {/* カレンダーグリッド */}
                                    <div className="grid grid-cols-7 bg-white">
                                        {calendarDays.map((day, i) => {
                                            const isSelected = day.dateStr === selectedDateRange.start || day.dateStr === selectedDateRange.end;
                                            const isInRange = selectedDateRange.start && selectedDateRange.end &&
                                                day.dateStr > selectedDateRange.start && day.dateStr < selectedDateRange.end;

                                            return (
                                                <div key={i} className="relative aspect-square border-r border-b border-gray-100">
                                                    {day.day && (
                                                        <button
                                                            onClick={() => handleDateClick(day.dateStr)}
                                                            className={`w-full h-full p-1 flex flex-col items-start justify-between transition-colors
                                                                ${isSelected ? 'bg-blue-600 text-white' :
                                                                    isInRange ? 'bg-blue-50 text-blue-800' :
                                                                        'hover:bg-gray-50'}`}
                                                        >
                                                            <span className="text-xs font-bold opacity-70">{day.day}</span>
                                                            <div className="w-full text-right">
                                                                {day.count > 0 ? (
                                                                    <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                                                        {day.count}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-gray-200">0</span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* アクション絞り込み */}
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 text-sm">アクション絞り込み</h3>
                            <button
                                onClick={toggleAllActions}
                                className="text-xs text-blue-600 hover:text-blue-800"
                            >
                                {selectedActions.length === allActionNames.length ? '全解除' : '全選択'}
                            </button>
                        </div>

                        <div className="space-y-1 max-h-[300px] overflow-y-auto">
                            {allActionNames.map(actionName => {
                                const count = analysis.actionStats[actionName]?.count || 0;
                                const isChecked = selectedActions.length === 0 || selectedActions.includes(actionName);
                                const isAllUnchecked = selectedActions.length === 0;

                                return (
                                    <label
                                        key={actionName}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked && !isAllUnchecked}
                                            className="cursor-pointer"
                                            onChange={() => toggleActionFilter(actionName)}
                                            style={isAllUnchecked ? { opacity: 0.3 } : {}}
                                        />
                                        <div className="flex-1 flex items-center justify-between min-w-0">
                                            <span className="text-sm text-gray-900 truncate text-left" title={actionName}>
                                                {actionName}
                                            </span>
                                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                                ({count.toLocaleString()}件)
                                            </span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* ユーザ絞り込み */}
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 text-sm">ユーザ絞り込み</h3>
                            <button
                                onClick={toggleAllUsers}
                                className="text-xs text-blue-600 hover:text-blue-800"
                            >
                                {selectedUsers.length === allUserNames.length ? '全解除' : '全選択'}
                            </button>
                        </div>

                        <div className="space-y-1 max-h-[300px] overflow-y-auto">
                            {allUserNames.map(userName => {
                                const userStats = analysis.userStats[userName];
                                const count = userStats?.totalActions || 0;
                                const isChecked = selectedUsers.length === 0 || selectedUsers.includes(userName);
                                const isAllUnchecked = selectedUsers.length === 0;

                                return (
                                    <label
                                        key={userName}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked && !isAllUnchecked}
                                            className="cursor-pointer"
                                            onChange={() => toggleUserFilter(userName)}
                                            style={isAllUnchecked ? { opacity: 0.3 } : {}}
                                        />
                                        <div className="flex-1 flex items-center justify-between min-w-0">
                                            <span className="text-sm text-gray-900 truncate text-left" title={userName}>
                                                {userName}
                                            </span>
                                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                                ({count.toLocaleString()}件)
                                            </span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 右側：ログ一覧 */}
                <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-600 mb-4">
                        {(selectedActions.length > 0 || selectedUsers.length > 0 || selectedDateRange.start || selectedDateRange.end) && (
                            <span className="text-blue-600 font-medium">
                                {selectedActions.length > 0 && `${selectedActions.length}個のアクション`}
                                {selectedActions.length > 0 && (selectedUsers.length > 0 || selectedDateRange.start || selectedDateRange.end) && ' + '}
                                {selectedUsers.length > 0 && `${selectedUsers.length}人のユーザ`}
                                {selectedUsers.length > 0 && (selectedDateRange.start || selectedDateRange.end) && ' + '}
                                {(selectedDateRange.start || selectedDateRange.end) && (
                                    <>
                                        期間（{selectedDateRange.start || '開始日なし'}〜{selectedDateRange.end || '終了日なし'}）
                                    </>
                                )}
                                で絞り込み中 -
                            </span>
                        )}
                        {' '}全{filteredLogs.length.toLocaleString()}件のログ（時系列順）
                        {(selectedActions.length > 0 || selectedUsers.length > 0 || selectedDateRange.start || selectedDateRange.end) && (
                            <button
                                onClick={() => {
                                    setSelectedActions([]);
                                    setSelectedUsers([]);
                                    setSelectedDateRange({ start: null, end: null });
                                }}
                                className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                                絞り込み解除
                            </button>
                        )}
                    </div>
                    <div className="max-h-[600px] overflow-y-auto">
                        <div className="flex items-center justify-end gap-3 text-xs text-gray-500 mb-2">
                            <span className="flex items-center gap-1">
                                <span className="inline-block w-3 h-3 rounded bg-blue-50 border border-blue-200"></span>
                                ユーザー操作
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="inline-block w-3 h-3 rounded bg-gray-100 border border-gray-300"></span>
                                システム処理
                            </span>
                        </div>
                        {filteredLogs.map((log, index) => (
                            <div key={index} className={`p-3 rounded mb-2 text-sm border-l-4 ${log.level === 'error' ? 'border-l-red-400' :
                                log.level === 'warning' ? 'border-l-yellow-400' :
                                    log.level === 'debug' ? 'border-l-gray-300' :
                                        'border-l-blue-400'
                                } ${log.source === 'client' ? 'bg-blue-50' : 'bg-gray-50'
                                }`}>
                                <div className="flex items-start justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 font-mono">#{index + 1}</span>
                                        <span className="font-medium text-gray-900">{log.action || 'unknown'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                        <span className="text-xs text-gray-500">
                                            {formatDate(log.timestamp || log.createdAt)}
                                        </span>
                                        {log.level && (
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${log.level === 'error' ? 'bg-red-100 text-red-700' :
                                                log.level === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                                    log.level === 'debug' ? 'bg-gray-100 text-gray-600' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {log.level}
                                            </span>
                                        )}
                                        {log.source && (
                                            <span className="text-xs text-gray-400">({log.source})</span>
                                        )}
                                    </div>
                                </div>
                                {log.userNickname && (
                                    <div className="text-xs text-gray-600 mb-1">
                                        <span className="font-medium">ユーザー:</span> {log.userNickname}
                                    </div>
                                )}
                                {log.detail && Object.keys(log.detail).length > 0 && (
                                    <div className="text-xs text-gray-600 mt-2 bg-white p-2 rounded text-left">
                                        {log.detail.msgPreview && (
                                            <div className="mb-2 px-2 py-1 border-l-2 border-gray-300 text-gray-700 italic">
                                                "{log.detail.msgPreview}"
                                            </div>
                                        )}
                                        {Object.entries(log.detail).map(([key, value]) => {
                                            if (['roomId', 'spaceId', 'msgPreview', 'nickname', 'userSocketId'].includes(key)) return null;
                                            if (key === 'newMsg') return (
                                                <div key={key} className="mb-1 px-2 py-1 border-l-2 border-blue-300 text-gray-700 italic">
                                                    → "{typeof value === 'string' && value.length > 40 ? value.substring(0, 40) + '...' : value}"
                                                </div>
                                            );
                                            let displayValue = JSON.stringify(value);
                                            if ((key === 'msg' || key === 'message') && typeof value === 'string' && value.length > 40) {
                                                displayValue = `"${value.substring(0, 40)}..."`;
                                            }
                                            return (
                                                <div key={key} className="mb-1">
                                                    <span className="font-medium text-blue-700">{key}:</span>{' '}
                                                    <span className="text-gray-700">{displayValue}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-16">
                    <div className="text-gray-600 text-lg">ログを分析中...</div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
                    {error}
                </div>
            );
        }

        if (!analysis) {
            return null;
        }

        return (
            <div>
                {/* タブナビゲーション */}
                <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
                    {[
                        { id: 'summary', label: 'サマリー' },
                        { id: 'actions', label: 'アクション統計' },
                        { id: 'users', label: 'ユーザー統計' },
                        { id: 'timeline', label: 'タイムライン' },
                        { id: 'recent', label: '最近のログ' },
                        { id: 'all', label: '全ログ一覧' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* タブコンテンツ */}
                <div className="mt-4">
                    {activeTab === 'summary' && renderSummary()}
                    {activeTab === 'actions' && renderActions()}
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'timeline' && renderTimeline()}
                    {activeTab === 'recent' && renderRecentLogs()}
                    {activeTab === 'all' && renderAllLogs()}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* ヘッダー */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="w-full px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">
                            ログ分析 - {analysis?.spaceData?.name || `スペース`} ({spaceId})
                        </h1>
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            </div>

            {/* メインコンテンツ */}
            <div className="w-full px-6 py-6">
                <div className="bg-white rounded-lg shadow p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default LogAnalysisPage;
