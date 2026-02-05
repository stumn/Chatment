// File: client/src/components/sidebar/SidebarContent.jsx

import React from 'react';
import { useParams } from 'react-router-dom';
import useAppStore from '../../../store/spaces/appStore';
import HorizontalDivider from '../../shared/ui/HorizontalDivider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

/**
 * サイドバーのメインコンテンツ部分（チャプターと注目コメント）
 * @param {Object} props - プロパティ
 * @param {Array} props.tocData - 目次データ（チャプターと注目コメントのリスト）
 * @param {boolean} props.isColorfulMode - カラフルモードの状態
 * @param {Function} props.onItemClick - 項目クリック時のハンドラ
 */
const SidebarContent = ({ tocData, isColorfulMode, onItemClick }) => {
    const { spaceId } = useParams();
    const documentId = 0;

    // フィルター状態を取得
    const selectedHeadingId = useAppStore((state) => state.selectedHeadingId);
    const indentFilter = useAppStore((state) => state.indentFilter);
    const minLikesFilter = useAppStore((state) => state.minLikesFilter);
    const setHeadingFilter = useAppStore((state) => state.setHeadingFilter);
    const setIndentFilter = useAppStore((state) => state.setIndentFilter);
    const setMinLikesFilter = useAppStore((state) => state.setMinLikesFilter);

    const openDocumentWindow = () => {
        // 新しいタブでドキュメントページを開く（React Routerを使用）
        const documentUrl = `/document/${spaceId}/${documentId}`;
        window.open(documentUrl, '_blank');
    };

    return (
        <div className="flex-1 px-6 overflow-hidden min-h-0 flex flex-col">
            <div className="flex flex-col h-full flex-1">

                <HorizontalDivider />
                {/* フィルターコントロール部分 */}
                <div className="flex flex-col gap-3 flex-shrink-0 py-3">
                    {/* 見出しフィルター */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 3L8 21M16 3L14 21M4.5 9H19.5M3.5 15H18.5" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <Box sx={{ flex: 1 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="heading-filter-label">見出しフィルター</InputLabel>
                                <Select
                                    labelId="heading-filter-label"
                                    id="heading-filter"
                                    value={selectedHeadingId || ''}
                                    label="見出しフィルター"
                                    onChange={(e) => setHeadingFilter(e.target.value || null)}
                                >
                                    <MenuItem value="">全て表示</MenuItem>
                                    {tocData.map(section => (
                                        <MenuItem key={section.id} value={section.id}>
                                            {section.msg.replace(/^#+\s*/, '')}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* インデントフィルター */}
                    <div className="flex flex-col gap-1">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 6L15 12L9 18" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span style={{ color: '#4b5563' }}>深さ</span>
                            <IconButton
                                size="small"
                                onClick={() => setIndentFilter(Math.max((indentFilter ?? 2) - 1, 0))}
                                sx={{ width: 28, height: 28 }}
                            >
                                <RemoveIcon fontSize="small" />
                            </IconButton>
                            <TextField
                                type="number"
                                size="small"
                                value={indentFilter ?? 2}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (!isNaN(val) && val >= 0 && val <= 2) {
                                        setIndentFilter(val);
                                    }
                                }}
                                inputProps={{
                                    min: 0,
                                    max: 2,
                                    style: { textAlign: 'center' }
                                }}
                                sx={{
                                    width: '3rem',
                                    '& input[type=number]': {
                                        MozAppearance: 'textfield'
                                    },
                                    '& input[type=number]::-webkit-outer-spin-button': {
                                        WebkitAppearance: 'none',
                                        margin: 0
                                    },
                                    '& input[type=number]::-webkit-inner-spin-button': {
                                        WebkitAppearance: 'none',
                                        margin: 0
                                    }
                                }}
                            />
                            <IconButton
                                size="small"
                                onClick={() => setIndentFilter(Math.min((indentFilter ?? 2) + 1, 2))}
                                sx={{ width: 28, height: 28 }}
                            >
                                <AddIcon fontSize="small" />
                            </IconButton>
                            <span style={{ color: '#4b5563' }}>まで見る</span>
                        </Box>
                    </div>

                    {/* 最小いいね数フィルター */}
                    <div className="flex flex-col gap-1">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 4L12 20M12 4L6 10M12 4L18 10" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span style={{ color: '#4b5563' }}>いいね</span>
                            <IconButton
                                size="small"
                                onClick={() => setMinLikesFilter(Math.max((minLikesFilter ?? 0) - 1, 0))}
                                sx={{ width: 28, height: 28 }}
                            >
                                <RemoveIcon fontSize="small" />
                            </IconButton>
                            <TextField
                                type="number"
                                size="small"
                                value={minLikesFilter ?? 0}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (!isNaN(val) && val >= 0) {
                                        setMinLikesFilter(val);
                                    }
                                }}
                                inputProps={{
                                    min: 0,
                                    style: { textAlign: 'center' }
                                }}
                                sx={{
                                    width: '3rem',
                                    '& input[type=number]': {
                                        MozAppearance: 'textfield'
                                    },
                                    '& input[type=number]::-webkit-outer-spin-button': {
                                        WebkitAppearance: 'none',
                                        margin: 0
                                    },
                                    '& input[type=number]::-webkit-inner-spin-button': {
                                        WebkitAppearance: 'none',
                                        margin: 0
                                    }
                                }}
                            />
                            <IconButton
                                size="small"
                                onClick={() => setMinLikesFilter((minLikesFilter ?? 0) + 1)}
                                sx={{ width: 28, height: 28 }}
                            >
                                <AddIcon fontSize="small" />
                            </IconButton>
                            <span style={{ color: '#4b5563' }}>個以上を見る</span>
                        </Box>
                    </div>
                </div>
                <HorizontalDivider />

                {/* 全編の振り返り（新しいタブで開く） */}
                <button
                    onClick={() => openDocumentWindow()}
                    className={`w-full text-left p-3 bg-transparent border-none rounded-lg cursor-pointer text-sm font-normal text-gray-700 transition-all duration-200 font-inherit hover:bg-gray-200 sb-heading-button flex-shrink-0 ${isColorfulMode ? 'colorful-mode' : ''}`}
                >
                    全編の振り返り（新しいタブで開く）
                </button>
                <HorizontalDivider />
            </div>
        </div>
    );
};

export default SidebarContent;