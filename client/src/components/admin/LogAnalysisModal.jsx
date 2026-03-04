import React, { useState, useEffect } from 'react';
import BaseModal from './ui/BaseModal';

/**
 * ログ分析モーダルコンポーネント
 * 
 * @param {Object} props - コンポーネントのプロップス
 * @param {boolean} props.isOpen - モーダルの表示状態
 * @param {Function} props.onClose - モーダルを閉じる関数
 * @param {number} props.spaceId - 分析対象のスペースID
 */
const LogAnalysisModal = ({ isOpen, onClose, spaceId }) => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('summary'); // summary, actions, users, timeline, logs

    useEffect(() => {
        if (isOpen && spaceId) {
            fetchLogAnalysis();
        }
    }, [isOpen, spaceId]);

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

    const renderSummary = () => {
        if (!analysis?.summary) return null;
        const { summary } = analysis;

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                                <td className="px-4 py-2 text-sm font-medium text-gray-900 border-b">{action}</td>
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
                                <td className="px-4 py-2 text-sm font-medium text-gray-900 border-b">{user}</td>
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

        return (
            <div className="space-y-2">
                <div className="text-sm text-gray-600 mb-4">
                    時間ごとのアクティビティ（1時間単位）
                </div>
                {analysis.timeline.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="text-xs text-gray-500 w-32 flex-shrink-0">
                            {formatDateShort(item.timestamp)}
                        </div>
                        <div className="flex-1 bg-gray-100 rounded overflow-hidden">
                            <div
                                className="bg-blue-500 h-6 flex items-center justify-end px-2"
                                style={{ width: `${(item.totalCount / maxCount) * 100}%`, minWidth: '30px' }}
                            >
                                <span className="text-xs text-white font-medium">{item.totalCount}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderLogs = () => {
        if (!analysis?.recentLogs || analysis.recentLogs.length === 0) {
            return <div className="text-center text-gray-500 py-4">最近のログがありません</div>;
        }

        return (
            <div className="space-y-2">
                <div className="text-sm text-gray-600 mb-4">
                    最新100件のログ（新しい順）
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                    {analysis.recentLogs.map((log, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded mb-2 text-sm">
                            <div className="flex items-start justify-between mb-1">
                                <span className="font-medium text-gray-900">{log.action || 'unknown'}</span>
                                <span className="text-xs text-gray-500">
                                    {formatDate(log.timestamp || log.createdAt)}
                                </span>
                            </div>
                            {log.detail && Object.keys(log.detail).length > 0 && (
                                <div className="text-xs text-gray-600 mt-1">
                                    {Object.entries(log.detail).map(([key, value]) => (
                                        <div key={key}>
                                            <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-8">
                    <div className="text-gray-600">ログを分析中...</div>
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
                <div className="flex border-b border-gray-200 mb-4">
                    {[
                        { id: 'summary', label: 'サマリー' },
                        { id: 'actions', label: 'アクション統計' },
                        { id: 'users', label: 'ユーザー統計' },
                        { id: 'timeline', label: 'タイムライン' },
                        { id: 'logs', label: '最近のログ' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
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
                    {activeTab === 'logs' && renderLogs()}
                </div>
            </div>
        );
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={`ログ分析 - スペース ${spaceId}`}
            maxWidth="900px"
        >
            {renderContent()}
        </BaseModal>
    );
};

export default LogAnalysisModal;
