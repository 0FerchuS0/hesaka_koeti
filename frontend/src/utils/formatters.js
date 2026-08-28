export const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0 Gs.'
    return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        maximumFractionDigits: 0,
    }).format(value).replace(/\s/, ' ')
}

const BUSINESS_TIME_ZONE = 'America/Asuncion'

const getBusinessDateParts = (value = new Date()) => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: BUSINESS_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    })

    const parts = formatter.formatToParts(value).reduce((acc, part) => {
        if (part.type !== 'literal') acc[part.type] = part.value
        return acc
    }, {})

    return {
        year: parts.year,
        month: parts.month,
        day: parts.day,
        hour: parts.hour,
        minute: parts.minute,
    }
}

export const parseBackendDateTime = (value) => {
    if (!value) return null
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

    const raw = String(value).trim()
    const localMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/)
    if (localMatch) {
        const [, y, m, d, hh = '00', mm = '00', ss = '00'] = localMatch
        const localDate = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss), 0)
        return Number.isNaN(localDate.getTime()) ? null : localDate
    }

    const parsed = new Date(raw)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = parseBackendDateTime(dateStr)
    if (!date) return '-'
    return date.toLocaleDateString('es-PY', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })
}

export const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    const date = parseBackendDateTime(dateStr)
    if (!date) return '-'
    return date.toLocaleString('es-PY')
}

export const toDateInputValue = (value) => {
    const date = parseBackendDateTime(value)
    if (!date) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export const toDateTimeLocalValue = (value) => {
    const date = parseBackendDateTime(value)
    if (!date) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
}

export const todayBusinessInputValue = () => {
    const { year, month, day } = getBusinessDateParts()
    return `${year}-${month}-${day}`
}

export const nowBusinessDateTimeLocalValue = () => {
    const { year, month, day, hour, minute } = getBusinessDateParts()
    return `${year}-${month}-${day}T${hour}:${minute}`
}

export const formatCurrentBusinessDate = (locale = 'es-PY', options = {}) =>
    new Intl.DateTimeFormat(locale, { timeZone: BUSINESS_TIME_ZONE, ...options }).format(new Date())

// Formatos locales paraguayos frecuentes (0XXXXXXXX, 09XXXXXXXX, 9XXXXXXXX,
// con o sin 595 duplicado por error de tipeo) se completan con el 595. Un
// numero que ya trae otro codigo de pais (ej. Brasil +55) no matchea ninguno
// de esos patrones y antes se descartaba a '' - ahora se deja pasar tal cual,
// siempre que tenga un largo razonable de telefono (8 a 15 digitos, E.164).
export const normalizarTelefonoWhatsapp = (value) => {
    let digits = String(value || '').replace(/\D/g, '')
    if (!digits) return ''

    if (digits.startsWith('00')) {
        digits = digits.slice(2)
    }

    if (digits.startsWith('59509')) {
        digits = `595${digits.slice(4)}`
    }

    if (digits.startsWith('5950')) {
        digits = `595${digits.slice(4)}`
    }

    if (digits.startsWith('09') && digits.length === 10) {
        return `595${digits.slice(1)}`
    }

    if (digits.startsWith('0') && digits.length >= 7 && digits.length <= 11) {
        return `595${digits.slice(1)}`
    }

    if (digits.startsWith('9') && digits.length >= 8 && digits.length <= 10) {
        return `595${digits}`
    }

    if (digits.length >= 8 && digits.length <= 15) {
        return digits
    }

    return ''
}
