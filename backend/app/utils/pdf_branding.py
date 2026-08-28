"""Pie de pagina estandar de HESAKA para los PDFs de informes/reportes del sistema."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, Spacer

_LOGO_PATH = Path(__file__).resolve().parent.parent / "static" / "branding" / "hesaka-logo-icon.png"


def pie_pagina_hesaka():
    """
    Devuelve los elementos (Spacer + Paragraph) del pie de pagina que debe
    ir como ultima linea de todo informe/reporte generado por el sistema:
    "Informe generado con [logo HESAKA] HESAKA - Sistema de Gestion Optica".
    """
    footer_style = ParagraphStyle(
        'HesakaFooter',
        fontSize=7,
        textColor=colors.HexColor('#95a5a6'),
        alignment=TA_CENTER,
    )

    if _LOGO_PATH.exists():
        texto = (
            f'Informe generado con <img src="{_LOGO_PATH.as_posix()}" width="11" height="7.3" valign="middle"/> '
            'HESAKA &mdash; Sistema de Gestion Optica'
        )
    else:
        texto = 'Informe generado con HESAKA &mdash; Sistema de Gestion Optica'

    return [Spacer(1, 0.4 * cm), Paragraph(texto, footer_style)]


def dibujar_pie_pagina_hesaka(c, width, y=1.0 * cm):
    """
    Version para PDFs dibujados a mano con reportlab.pdfgen.canvas (sin
    SimpleDocTemplate): dibuja la misma linea de marca HESAKA centrada, en
    la posicion 'y' indicada (desde abajo de la pagina).
    """
    pre = "Informe generado con "
    post = "  HESAKA — Sistema de Gestion Optica"
    img_w, img_h = 11, 7.3
    gap = 2

    c.saveState()
    c.setFont("Helvetica", 7)
    c.setFillColorRGB(0.584, 0.647, 0.651)

    logo_disponible = _LOGO_PATH.exists()
    pre_w = c.stringWidth(pre, "Helvetica", 7)
    post_w = c.stringWidth(post, "Helvetica", 7)
    total_w = pre_w + post_w + (img_w + gap * 2 if logo_disponible else 0)

    x = (width - total_w) / 2
    c.drawString(x, y, pre)
    x += pre_w + gap

    if logo_disponible:
        try:
            c.drawImage(
                str(_LOGO_PATH),
                x,
                y - 1,
                width=img_w,
                height=img_h,
                mask="auto",
            )
            x += img_w + gap
        except Exception:
            pass

    c.drawString(x, y, post)
    c.restoreState()
