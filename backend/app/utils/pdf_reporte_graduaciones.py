import io
from datetime import date

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.utils.pdf_branding import pie_pagina_hesaka


def _fmt_grad(value: float) -> str:
    return f"{value:+.2f}" if value else "PL"


def _fmt_adicion(value) -> str:
    return f"{value:+.2f}" if value else "-"


def _fmt_pct(value: float) -> str:
    return f"{value:.1f}%"


def generar_pdf_reporte_graduaciones(datos, config, fecha_desde: date, fecha_hasta: date, tipo_lente: str):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=1.2 * cm,
        rightMargin=1.2 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.2 * cm,
    )
    styles = getSampleStyleSheet()
    story = []

    empresa = config.nombre if config and config.nombre else "HESAKA"
    story.append(Paragraph(f"<b>{empresa}</b>", styles["Title"]))
    story.append(Paragraph("Graduaciones más demandadas (compra de stock de cristales)", styles["Heading2"]))
    story.append(Paragraph(
        f"Periodo: {fecha_desde.strftime('%d/%m/%Y')} al {fecha_hasta.strftime('%d/%m/%Y')} — Tipo de lente: {tipo_lente}",
        styles["Normal"],
    ))
    story.append(Spacer(1, 0.3 * cm))

    resumen_table = Table([
        ["Unidades analizadas", "Excluidas (sin graduación)", "% Demanda terminado", "% Demanda laboratorio"],
        [
            str(datos.total_unidades_analizadas),
            str(datos.total_excluidas_sin_graduacion),
            _fmt_pct(datos.porcentaje_demanda_terminado),
            _fmt_pct(datos.porcentaje_demanda_laboratorio),
        ],
    ], colWidths=[6 * cm, 6 * cm, 6 * cm, 6 * cm])
    resumen_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#f8fafc")),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(resumen_table)
    story.append(Spacer(1, 0.35 * cm))

    story.append(Paragraph("<b>Ranking de graduaciones</b>", styles["Heading3"]))
    detalle_rows = [[
        "Esfera", "Cilindro", "Adición", "Recetadas", "Vendidas acá", "Receta externa",
        "Demanda total", "Tasa conversión", "% del total", "¿Terminado?",
    ]]
    for fila in datos.filas:
        detalle_rows.append([
            _fmt_grad(fila.esfera),
            _fmt_grad(fila.cilindro),
            _fmt_adicion(fila.adicion),
            str(fila.recetadas),
            str(fila.vendidas_aca),
            str(fila.receta_externa),
            str(fila.demanda_total),
            _fmt_pct(fila.tasa_conversion * 100) if fila.tasa_conversion is not None else "-",
            _fmt_pct(fila.porcentaje_total),
            "Sí" if fila.es_terminado else "No",
        ])
    detalle_table = Table(
        detalle_rows,
        colWidths=[2.6 * cm, 2.6 * cm, 2.4 * cm, 2.8 * cm, 3.2 * cm, 3.2 * cm, 3.2 * cm, 3.2 * cm, 2.8 * cm, 2.8 * cm],
        repeatRows=1,
    )
    detalle_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#d1d5db")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(detalle_table)
    story.extend(pie_pagina_hesaka())

    doc.build(story)
    buffer.seek(0)
    return buffer
