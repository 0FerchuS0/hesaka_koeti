import { useEffect, useMemo, useState } from 'react'
import { BarChart3, CalendarRange, Glasses, Grid3x3, Layers, Percent, SlidersHorizontal } from 'lucide-react'

import LoadingButton from '../components/LoadingButton'
import { api } from '../context/AuthContext'
import { exportReportBlob } from '../utils/reportExports'

const formatYmd = date =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const restarMeses = (date, meses) => {
    const copia = new Date(date)
    copia.setMonth(copia.getMonth() - meses)
    return copia
}

const formatGrad = value => {
    if (value === null || value === undefined) return '--'
    if (value === 0) return 'PL'
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}`
}

const formatAdicion = value => {
    if (value === null || value === undefined) return '--'
    return `+${value.toFixed(2)}`
}

const formatPercent = value => {
    if (value === null || value === undefined) return '--'
    return `${value.toFixed(1)}%`
}

const panelStyle = {
    borderRadius: 20,
    border: '1px solid rgba(148, 163, 184, 0.14)',
    background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.94) 0%, rgba(17, 24, 39, 0.88) 100%)',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.24)',
}

const summaryCardStyle = {
    display: 'grid',
    gridTemplateColumns: '48px 1fr',
    gap: 14,
    alignItems: 'start',
    minHeight: 120,
    padding: 18,
    borderRadius: 16,
    border: '1px solid var(--border)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
}

const headerCellStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    background: 'linear-gradient(180deg, #1f2432 0%, #171c28 100%)',
}

const TIPOS_LENTE = [
    { value: 'MONOFOCAL', label: 'Monofocal' },
    { value: 'BIFOCAL', label: 'Bifocal' },
    { value: 'MULTIFOCAL_PROGRESIVO', label: 'Multifocal / Progresivo' },
    { value: 'TODOS', label: 'Todos' },
]

function SectionEyebrow({ icon: Icon, text, color = '#c4b5fd' }) {
    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 12px',
                borderRadius: 999,
                background: `${color}18`,
                color,
                border: `1px solid ${color}26`,
                fontSize: '0.78rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
            }}
        >
            <Icon size={14} />
            {text}
        </div>
    )
}

function SummaryCard({ icon, accent, accentSoft, title, value, subtitle }) {
    return (
        <div style={{ ...summaryCardStyle, borderLeft: `4px solid ${accent}` }}>
            <div
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: accentSoft,
                    color: accent,
                    fontSize: 22,
                    fontWeight: 800,
                }}
            >
                {icon}
            </div>
            <div>
                <div className="kpi-title" style={{ marginBottom: 8 }}>{title}</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.15 }}>
                    {value}
                </div>
                {subtitle && <div className="kpi-subtitle" style={{ marginTop: 8 }}>{subtitle}</div>}
            </div>
        </div>
    )
}

function Heatmap({ esferas, cilindros, valores, cornerLabel = 'Esf \\ Cil', formatColumna = formatGrad, colLabel = 'Cilindro' }) {
    const max = useMemo(() => {
        let m = 0
        for (const fila of valores) {
            for (const v of fila) {
                if (v > m) m = v
            }
        }
        return m
    }, [valores])

    if (!esferas.length || !cilindros.length) {
        return <div style={{ padding: 24, color: 'var(--text-muted)', textAlign: 'center' }}>Sin datos para el rango configurado.</div>
    }

    return (
        <div style={{ overflow: 'auto', maxHeight: '60vh', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `72px repeat(${cilindros.length}, 52px)`,
                    width: 'max-content',
                }}
            >
                <div style={{ ...headerCellStyle, padding: '8px 6px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {cornerLabel}
                </div>
                {cilindros.map(c => (
                    <div key={c} style={{ ...headerCellStyle, padding: '8px 4px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {formatColumna(c)}
                    </div>
                ))}
                {esferas.map((esf, filaIdx) => (
                    <div key={esf} style={{ display: 'contents' }}>
                        <div
                            style={{
                                position: 'sticky',
                                left: 0,
                                zIndex: 1,
                                padding: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: 'var(--text-secondary)',
                                background: '#171c28',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                            }}
                        >
                            {formatGrad(esf)}
                        </div>
                        {cilindros.map((c, colIdx) => {
                            const valor = valores?.[filaIdx]?.[colIdx] || 0
                            const intensidad = max > 0 ? valor / max : 0
                            const alpha = valor > 0 ? 0.12 + intensidad * 0.78 : 0.03
                            return (
                                <div
                                    key={c}
                                    title={`Esfera ${formatGrad(esf)} / ${colLabel} ${formatColumna(c)}: ${valor} unidades`}
                                    style={{
                                        height: 30,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: `rgba(124, 77, 255, ${alpha})`,
                                        color: intensidad > 0.55 ? '#fff' : 'var(--text-secondary)',
                                        fontSize: '0.72rem',
                                        fontWeight: valor > 0 ? 700 : 400,
                                        borderRight: '1px solid rgba(255,255,255,0.03)',
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    }}
                                >
                                    {valor > 0 ? valor : ''}
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function ReporteGraduacionesDemandadasPage() {
    const hoy = useMemo(() => new Date(), [])

    const filtrosIniciales = {
        fechaDesde: formatYmd(restarMeses(hoy, 6)),
        fechaHasta: formatYmd(hoy),
        tipoLente: 'MONOFOCAL',
        esferaMax: 6,
        cilindroMin: -2,
        adicionMin: 0.75,
        adicionMax: 3.5,
        paso: 0.25,
        incluirFueraDeRango: true,
    }

    const [loading, setLoading] = useState(false)
    const [exportingPdf, setExportingPdf] = useState(false)
    const [exportingExcel, setExportingExcel] = useState(false)
    const [error, setError] = useState('')
    const [data, setData] = useState(null)
    const [mostrarAvanzado, setMostrarAvanzado] = useState(false)
    const [filtros, setFiltros] = useState(filtrosIniciales)
    const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosIniciales)

    useEffect(() => {
        cargarReporte(filtrosAplicados)
    }, [filtrosAplicados])

    const buildParams = filtrosActuales => {
        const params = new URLSearchParams()
        params.append('fecha_desde', filtrosActuales.fechaDesde)
        params.append('fecha_hasta', filtrosActuales.fechaHasta)
        params.append('tipo_lente', filtrosActuales.tipoLente)
        params.append('esfera_max', filtrosActuales.esferaMax)
        params.append('cilindro_min', filtrosActuales.cilindroMin)
        params.append('adicion_min', filtrosActuales.adicionMin)
        params.append('adicion_max', filtrosActuales.adicionMax)
        params.append('paso', filtrosActuales.paso)
        params.append('incluir_fuera_de_rango', filtrosActuales.incluirFueraDeRango)
        return params
    }

    const cargarReporte = async filtrosActuales => {
        try {
            setLoading(true)
            setError('')
            const response = await api.get(`/reportes/graduaciones-demandadas?${buildParams(filtrosActuales).toString()}`)
            setData(response.data || null)
        } catch (err) {
            console.error('Error cargando reporte de graduaciones demandadas:', err)
            setError(err?.response?.data?.detail || 'No se pudo cargar el reporte de graduaciones demandadas.')
            setData(null)
        } finally {
            setLoading(false)
        }
    }

    const aplicarPreset = meses => {
        const nuevos = { ...filtros, fechaDesde: formatYmd(restarMeses(hoy, meses)), fechaHasta: formatYmd(hoy) }
        setFiltros(nuevos)
        setFiltrosAplicados(nuevos)
    }

    const aplicarFiltros = () => setFiltrosAplicados({ ...filtros })

    const exportarPdf = async () => {
        try {
            setExportingPdf(true)
            await exportReportBlob(
                `/reportes/graduaciones-demandadas/pdf?${buildParams(filtrosAplicados).toString()}`,
                'application/pdf',
                { openInNewTab: true }
            )
        } catch (err) {
            console.error('Error al exportar PDF:', err)
        } finally {
            setExportingPdf(false)
        }
    }

    const exportarExcel = async () => {
        try {
            setExportingExcel(true)
            await exportReportBlob(
                `/reportes/graduaciones-demandadas/excel?${buildParams(filtrosAplicados).toString()}`,
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        } catch (err) {
            console.error('Error al exportar Excel:', err)
        } finally {
            setExportingExcel(false)
        }
    }

    const filas = Array.isArray(data?.filas) ? data.filas : []

    return (
        <div className="page-container">
            <header
                className="page-header"
                style={{
                    marginBottom: 22,
                    padding: '22px 24px',
                    borderRadius: 22,
                    border: '1px solid rgba(124, 77, 255, 0.18)',
                    background: 'radial-gradient(circle at top left, rgba(124, 77, 255, 0.14), transparent 42%), linear-gradient(180deg, rgba(15, 23, 42, 0.94) 0%, rgba(17, 24, 39, 0.88) 100%)',
                }}
            >
                <div>
                    <SectionEyebrow icon={Glasses} text="Compra de stock" />
                    <h1 className="page-title">Graduaciones más demandadas</h1>
                    <p className="page-subtitle" style={{ maxWidth: 880 }}>
                        Combina recetas de consulta clínica y ventas (incluyendo recetas externas) para mostrar qué
                        combinaciones de esfera+cilindro (monofocal distancia) y esfera+adición (progresivos/lectura,
                        sin cilindro) conviene stockear como cristal terminado. Esfera+cilindro+adición juntos siempre
                        requiere laboratorio, no se considera terminado.
                    </p>
                </div>
            </header>

            <div className="card filters-panel" style={{ ...panelStyle, marginBottom: 22, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                    <SectionEyebrow icon={CalendarRange} text="Periodo y filtros" color="#93c5fd" />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => aplicarPreset(3)}>Últimos 3 meses</button>
                        <button type="button" className="btn btn-secondary" onClick={() => aplicarPreset(6)}>Últimos 6 meses</button>
                        <button type="button" className="btn btn-secondary" onClick={() => aplicarPreset(12)}>Últimos 12 meses</button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, alignItems: 'end' }}>
                    <div className="form-group">
                        <label>Fecha desde</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filtros.fechaDesde}
                            onChange={event => setFiltros(prev => ({ ...prev, fechaDesde: event.target.value }))}
                        />
                    </div>
                    <div className="form-group">
                        <label>Fecha hasta</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filtros.fechaHasta}
                            onChange={event => setFiltros(prev => ({ ...prev, fechaHasta: event.target.value }))}
                        />
                    </div>
                    <div className="form-group">
                        <label>Tipo de lente</label>
                        <select
                            className="form-input"
                            value={filtros.tipoLente}
                            onChange={event => setFiltros(prev => ({ ...prev, tipoLente: event.target.value }))}
                        >
                            {TIPOS_LENTE.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <LoadingButton className="btn btn-primary" onClick={aplicarFiltros} loading={loading} loadingText="Generando...">
                            Generar reporte
                        </LoadingButton>
                        <LoadingButton className="btn" style={{ backgroundColor: '#27ae60', color: 'white' }} onClick={exportarExcel} loading={exportingExcel} loadingText="Generando Excel..." disabled={exportingPdf}>
                            Excel
                        </LoadingButton>
                        <LoadingButton className="btn" style={{ backgroundColor: '#e74c3c', color: 'white' }} onClick={exportarPdf} loading={exportingPdf} loadingText="Exportando PDF..." disabled={exportingExcel}>
                            PDF
                        </LoadingButton>
                    </div>
                </div>

                <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    onClick={() => setMostrarAvanzado(prev => !prev)}
                >
                    <SlidersHorizontal size={14} />
                    {mostrarAvanzado ? 'Ocultar parámetros de rango terminado' : 'Configurar rango de cristal terminado'}
                </button>

                {mostrarAvanzado && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginTop: 16, padding: 16, borderRadius: 14, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                        <div className="form-group">
                            <label>Esfera máx. (±)</label>
                            <input
                                type="number"
                                step="0.25"
                                className="form-input"
                                value={filtros.esferaMax}
                                onChange={event => setFiltros(prev => ({ ...prev, esferaMax: Number(event.target.value) }))}
                            />
                        </div>
                        <div className="form-group">
                            <label>Cilindro mín.</label>
                            <input
                                type="number"
                                step="0.25"
                                className="form-input"
                                value={filtros.cilindroMin}
                                onChange={event => setFiltros(prev => ({ ...prev, cilindroMin: Number(event.target.value) }))}
                            />
                        </div>
                        <div className="form-group">
                            <label>Adición mín.</label>
                            <input
                                type="number"
                                step="0.25"
                                className="form-input"
                                value={filtros.adicionMin}
                                onChange={event => setFiltros(prev => ({ ...prev, adicionMin: Number(event.target.value) }))}
                            />
                        </div>
                        <div className="form-group">
                            <label>Adición máx.</label>
                            <input
                                type="number"
                                step="0.25"
                                className="form-input"
                                value={filtros.adicionMax}
                                onChange={event => setFiltros(prev => ({ ...prev, adicionMax: Number(event.target.value) }))}
                            />
                        </div>
                        <div className="form-group">
                            <label>Paso</label>
                            <input
                                type="number"
                                step="0.25"
                                className="form-input"
                                value={filtros.paso}
                                onChange={event => setFiltros(prev => ({ ...prev, paso: Number(event.target.value) }))}
                            />
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22 }}>
                            <input
                                type="checkbox"
                                id="incluirFueraDeRango"
                                checked={filtros.incluirFueraDeRango}
                                onChange={event => setFiltros(prev => ({ ...prev, incluirFueraDeRango: event.target.checked }))}
                            />
                            <label htmlFor="incluirFueraDeRango" style={{ margin: 0 }}>Incluir fuera de rango en el ranking</label>
                        </div>
                    </div>
                )}
            </div>

            {data && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
                    <SummaryCard
                        icon={<Layers size={22} />}
                        accent="#7C4DFF"
                        accentSoft="rgba(124, 77, 255, 0.14)"
                        title="Unidades analizadas"
                        value={data.total_unidades_analizadas}
                        subtitle="Lentes individuales (por ojo)"
                    />
                    <SummaryCard
                        icon={<BarChart3 size={22} />}
                        accent="#f59e0b"
                        accentSoft="rgba(245, 158, 11, 0.14)"
                        title="Excluidas sin graduación"
                        value={data.total_excluidas_sin_graduacion}
                        subtitle="Dato faltante o ilegible"
                    />
                    <SummaryCard
                        icon={<Percent size={22} />}
                        accent="#22c55e"
                        accentSoft="rgba(34, 197, 94, 0.14)"
                        title="Demanda en rango terminado"
                        value={formatPercent(data.porcentaje_demanda_terminado)}
                        subtitle={`${formatPercent(data.porcentaje_demanda_laboratorio)} requiere laboratorio`}
                    />
                </div>
            )}

            <div className="card" style={{ ...panelStyle, marginBottom: 20, padding: 20 }}>
                <div style={{ marginBottom: 14 }}>
                    <SectionEyebrow icon={Grid3x3} text="Heatmap" color="#c4b5fd" />
                    <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', margin: '6px 0' }}>Esfera × Cilindro</h3>
                    <div className="page-subtitle">Concentración de demanda dentro del rango de cristal terminado configurado.</div>
                </div>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                    </div>
                ) : (
                    <Heatmap esferas={data?.matriz_esferas || []} cilindros={data?.matriz_cilindros || []} valores={data?.matriz_valores || []} />
                )}
            </div>

            <div className="card" style={{ ...panelStyle, marginBottom: 20, padding: 20 }}>
                <div style={{ marginBottom: 14 }}>
                    <SectionEyebrow icon={Grid3x3} text="Heatmap" color="#c4b5fd" />
                    <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', margin: '6px 0' }}>Esfera × Adición (progresivos / lectura terminados)</h3>
                    <div className="page-subtitle">Solo combinaciones sin cilindro (esfera + adición). Con cilindro presente, esa graduación va como "requiere laboratorio" en el ranking, no acá.</div>
                </div>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                    </div>
                ) : (
                    <Heatmap
                        esferas={data?.matriz_esferas_progresivo || []}
                        cilindros={data?.matriz_adiciones || []}
                        valores={data?.matriz_valores_progresivo || []}
                        cornerLabel="Esf \ Add"
                        formatColumna={formatAdicion}
                        colLabel="Adición"
                    />
                )}
            </div>

            <div className="card" style={panelStyle}>
                <div style={{ padding: '20px 20px 0' }}>
                    <SectionEyebrow icon={BarChart3} text="Ranking" color="#93c5fd" />
                    <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', margin: '6px 0' }}>Detalle por combinación</h3>
                    <div className="page-subtitle" style={{ marginBottom: 14 }}>
                        Ordenado por demanda total. Tasa de conversión baja con demanda alta = candidata a stockear.
                    </div>
                </div>
                <div className="table-responsive" style={{ maxHeight: '55vh', overflow: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={headerCellStyle}>Esfera</th>
                                <th style={headerCellStyle}>Cilindro</th>
                                <th style={headerCellStyle}>Adición</th>
                                <th className="text-right" style={headerCellStyle}>Recetadas</th>
                                <th className="text-right" style={headerCellStyle}>Vendidas acá</th>
                                <th className="text-right" style={headerCellStyle}>Receta externa</th>
                                <th className="text-right" style={headerCellStyle}>Demanda total</th>
                                <th className="text-right" style={headerCellStyle}>Tasa conversión</th>
                                <th className="text-right" style={headerCellStyle}>% del total</th>
                                <th className="text-center" style={headerCellStyle}>¿Terminado?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="10" className="text-center" style={{ padding: 40 }}>
                                        <div className="spinner" style={{ margin: '0 auto' }} />
                                        <div style={{ marginTop: 10, color: 'var(--text-muted)' }}>Calculando demanda...</div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="10" className="text-center text-danger" style={{ padding: 20 }}>{error}</td>
                                </tr>
                            ) : filas.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>
                                        No se encontraron graduaciones para el período y filtros elegidos.
                                    </td>
                                </tr>
                            ) : (
                                filas.map(fila => (
                                    <tr key={`${fila.esfera}-${fila.cilindro}-${fila.adicion}`}>
                                        <td>{formatGrad(fila.esfera)}</td>
                                        <td>{formatGrad(fila.cilindro)}</td>
                                        <td>{formatAdicion(fila.adicion)}</td>
                                        <td className="text-right">{fila.recetadas}</td>
                                        <td className="text-right">{fila.vendidas_aca}</td>
                                        <td className="text-right">{fila.receta_externa}</td>
                                        <td className="text-right" style={{ fontWeight: 800, color: '#c4b5fd' }}>{fila.demanda_total}</td>
                                        <td className="text-right">{fila.tasa_conversion === null ? '--' : formatPercent(fila.tasa_conversion * 100)}</td>
                                        <td className="text-right">{formatPercent(fila.porcentaje_total)}</td>
                                        <td className="text-center">
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    padding: '4px 10px',
                                                    borderRadius: 999,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 800,
                                                    background: fila.es_terminado ? 'rgba(34, 197, 94, 0.14)' : 'rgba(148, 163, 184, 0.14)',
                                                    color: fila.es_terminado ? '#86efac' : 'var(--text-muted)',
                                                }}
                                            >
                                                {fila.es_terminado ? 'Sí' : 'No'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
