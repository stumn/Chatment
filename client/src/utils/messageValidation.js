export const MESSAGE_VALIDATION_REASON = {
    EMPTY: 'empty',
    TOO_LONG: 'too-long',
    TOO_MANY_LINES: 'too-many-lines',
    INVALID_AFTER_NORMALIZE: 'invalid-after-normalize'
};

export function validateAndNormalizeMessage(input, options = {}) {
    const { maxLength = 140, maxLines = 5 } = options;
    const raw = typeof input === 'string' ? input : '';

    if (!raw.trim()) {
        return {
            success: false,
            reason: MESSAGE_VALIDATION_REASON.EMPTY
        };
    }

    if (raw.length > maxLength) {
        return {
            success: false,
            reason: MESSAGE_VALIDATION_REASON.TOO_LONG,
            length: raw.length
        };
    }

    const lineCount = raw.split('\n').length;
    if (lineCount > maxLines) {
        return {
            success: false,
            reason: MESSAGE_VALIDATION_REASON.TOO_MANY_LINES,
            lineCount
        };
    }

    const normalized = raw
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\r/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    if (!normalized) {
        return {
            success: false,
            reason: MESSAGE_VALIDATION_REASON.INVALID_AFTER_NORMALIZE
        };
    }

    return {
        success: true,
        validatedMsg: normalized
    };
}

export function resolveValidationFailure(validation, reasonMap = {}, defaultMessage = '有効な文字が含まれていません。') {
    if (validation?.success) return null;

    const matched = reasonMap[validation?.reason];
    if (!matched) {
        return { message: defaultMessage };
    }

    if (typeof matched === 'string') {
        return { message: matched };
    }

    return {
        message: matched.message || defaultMessage,
        warnMessage: matched.warnMessage
    };
}
