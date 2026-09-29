"""Professional Analytical PDF Report Generation Service using ReportLab.

Implements enterprise-grade PDF reports for Daily Gameplay Analytics
and Individual Player Performance Dossiers with intelligent pagination,
dual win-rate reconciliations, vector data visualizations, and optional AES-256 encryption.
"""

import io
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Group


def compute_letter_feedback(target_word: str, guess_word: str) -> List[Tuple[str, str]]:
    """
    Compute Wordle-style feedback for each letter in guess_word against target_word.
    Returns a list of tuples: (char, status) where status is:
      'C' (correct position - green)
      'W' (wrong position - amber)
      'A' (absent - slate)
    """
    if not target_word or not guess_word:
        return [(c, "A") for c in (guess_word or "")]

    target = list(target_word.upper())
    guess = list(guess_word.upper())
    n = len(guess)
    feedback = ["A"] * n
    target_counts: Dict[str, int] = {}

    for i in range(min(n, len(target))):
        if guess[i] == target[i]:
            feedback[i] = "C"
        else:
            target_counts[target[i]] = target_counts.get(target[i], 0) + 1

    for i in range(n):
        if feedback[i] != "C":
            ch = guess[i]
            if target_counts.get(ch, 0) > 0:
                feedback[i] = "W"
                target_counts[ch] -= 1

    return list(zip(guess, feedback))


def encrypt_pdf_buffer(raw_buffer: io.BytesIO, password: Optional[str]) -> io.BytesIO:
    """
    Encrypt an in-memory PDF buffer with AES-256 using pypdf if available, or PyPDF2 fallback.
    If no password is provided, returns raw_buffer unmodified.
    """
    if not password or not password.strip():
        raw_buffer.seek(0)
        return raw_buffer

    clean_pwd = password.strip()
    raw_buffer.seek(0)

    # Try modern pypdf first
    try:
        import pypdf
        reader = pypdf.PdfReader(raw_buffer)
        writer = pypdf.PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        writer.encrypt(user_password=clean_pwd, owner_password=clean_pwd, algorithm="AES-256")
        encrypted_buffer = io.BytesIO()
        writer.write(encrypted_buffer)
        encrypted_buffer.seek(0)
        return encrypted_buffer
    except Exception:
        pass

    # Fallback to PyPDF2
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(raw_buffer)
        writer = PyPDF2.PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        try:
            writer.encrypt(user_password=clean_pwd, owner_password=clean_pwd)
        except TypeError:
            writer.encrypt(user_pwd=clean_pwd, owner_pwd=clean_pwd, use_128bit=True)
        encrypted_buffer = io.BytesIO()
        writer.write(encrypted_buffer)
        encrypted_buffer.seek(0)
        return encrypted_buffer
    except Exception:
        pass

    raw_buffer.seek(0)
    return raw_buffer


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas that dynamically calculates total page count and renders
    crisp running headers and footers across all report pages.
    """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self._saved_page_states: List[Dict[str, Any]] = []

    def showPage(self) -> None:
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self) -> None:
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int) -> None:
        """Render running header (page >= 2) and subtle footer on every page."""
        self.saveState()
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))

        # Footer divider line
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.75)
        self.line(36, 30, A4[0] - 36, 30)

        # Footer Left: Branding & Confidentiality
        self.drawString(36, 20, "Guess the Word · Enterprise Administrative Analytics · Confidential")

        # Footer Right: Page Numbers
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(A4[0] - 36, 20, page_str)

        # Running Header on page 2+
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(colors.HexColor("#1E3A8A"))
            self.drawString(36, A4[1] - 24, "GUESS THE WORD · ADMINISTRATIVE ANALYTICS")
            self.setFont("Helvetica", 7.5)
            self.setFillColor(colors.HexColor("#94A3B8"))
            self.drawRightString(A4[0] - 36, A4[1] - 24, datetime.now().strftime("%d %b %Y"))
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(36, A4[1] - 28, A4[0] - 36, A4[1] - 28)

        self.restoreState()


class PDFReportService:
    """Comprehensive service generating professional analytical PDF reports."""

    def __init__(self) -> None:
        self.page_width, self.page_height = A4
        self.margin = 36  # 0.5 inch margin
        self.usable_width = self.page_width - (2 * self.margin)  # 523.27 pt

        # Modern Executive Color Palette
        self.c_primary = colors.HexColor("#0F172A")     # Slate 900
        self.c_navy = colors.HexColor("#1E3A8A")        # Blue 900
        self.c_blue = colors.HexColor("#2563EB")        # Blue 600
        self.c_muted = colors.HexColor("#64748B")       # Slate 500
        self.c_border = colors.HexColor("#E2E8F0")      # Slate 200
        self.c_border_subtle = colors.HexColor("#CBD5E1") # Slate 300
        self.c_bg_light = colors.HexColor("#F8FAFC")    # Slate 50
        self.c_bg_alt = colors.HexColor("#F1F5F9")      # Slate 100
        self.c_bg_subtle = colors.HexColor("#EFF6FF")   # Blue 50
        self.c_success = colors.HexColor("#10B981")     # Emerald 500
        self.c_success_dark = colors.HexColor("#059669")# Emerald 600
        self.c_danger = colors.HexColor("#EF4444")      # Red 500
        self.c_danger_dark = colors.HexColor("#DC2626") # Red 600
        self.c_warning = colors.HexColor("#F59E0B")     # Amber 500
        self.c_warning_dark = colors.HexColor("#D97706")# Amber 600
        self.c_active = colors.HexColor("#6366F1")      # Indigo 500
        self.c_active_dark = colors.HexColor("#4F46E5") # Indigo 600

        # Stylesheet initialization
        styles = getSampleStyleSheet()

        self.style_brand = ParagraphStyle(
            "BrandHeading",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=self.c_blue,
            spaceAfter=2,
        )

        self.style_title = ParagraphStyle(
            "ReportTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=18,
            textColor=self.c_primary,
            spaceAfter=2,
        )

        self.style_meta = ParagraphStyle(
            "ReportMeta",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10.5,
            textColor=self.c_muted,
        )

        self.style_section_title = ParagraphStyle(
            "SectionTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9.5,
            leading=12.5,
            textColor=self.c_navy,
            spaceBefore=8,
            spaceAfter=4,
            keepWithNext=True,
        )

        self.style_kpi_label = ParagraphStyle(
            "KpiLabel",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=6.5,
            leading=8,
            textColor=self.c_muted,
            alignment=TA_LEFT,
        )

        self.style_kpi_val = ParagraphStyle(
            "KpiVal",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=14,
            textColor=self.c_primary,
            alignment=TA_LEFT,
        )

        self.style_th = ParagraphStyle(
            "TableHeader",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=6.8,
            leading=8.5,
            textColor=colors.HexColor("#1E293B"),
            alignment=TA_LEFT,
        )

        self.style_th_right = ParagraphStyle(
            "TableHeaderRight",
            parent=self.style_th,
            alignment=TA_RIGHT,
        )

        self.style_th_center = ParagraphStyle(
            "TableHeaderCenter",
            parent=self.style_th,
            alignment=TA_CENTER,
        )

        self.style_td = ParagraphStyle(
            "TableCell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=6.8,
            leading=8.5,
            textColor=self.c_primary,
            alignment=TA_LEFT,
        )

        self.style_td_right = ParagraphStyle(
            "TableCellRight",
            parent=self.style_td,
            alignment=TA_RIGHT,
        )

        self.style_td_center = ParagraphStyle(
            "TableCellCenter",
            parent=self.style_td,
            alignment=TA_CENTER,
        )

        self.style_td_bold = ParagraphStyle(
            "TableCellBold",
            parent=self.style_td,
            fontName="Helvetica-Bold",
        )

        self.style_td_bold_right = ParagraphStyle(
            "TableCellBoldRight",
            parent=self.style_td_right,
            fontName="Helvetica-Bold",
        )

        self.style_empty = ParagraphStyle(
            "EmptyNotice",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10,
            textColor=self.c_muted,
            alignment=TA_CENTER,
        )

        self.style_method_body = ParagraphStyle(
            "MethodBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=6.8,
            leading=9,
            textColor=colors.HexColor("#334155"),
        )

    def _format_period(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        target_date: Optional[date] = None,
    ) -> str:
        """Format human-readable reporting period string."""
        if target_date:
            return target_date.strftime("%d %B %Y")
        if start_date and end_date:
            if start_date == end_date:
                return start_date.strftime("%d %B %Y")
            return f"{start_date.strftime('%d %b %Y')} – {end_date.strftime('%d %b %Y')}"
        if start_date:
            return f"From {start_date.strftime('%d %b %Y')}"
        if end_date:
            return f"Until {end_date.strftime('%d %b %Y')}"
        return "All Time (Historical)"

    def _build_header(
        self,
        title: str,
        period_str: str,
        extra_meta: Optional[str] = None,
        badge_label: str = "ADMINISTRATIVE REPORT",
    ) -> List[Any]:
        """Create clean, executive report header banner."""
        now_str = datetime.now().strftime("%d %b %Y at %H:%M:%S UTC")
        meta_lines = [
            f"<b>Reporting Scope:</b> {period_str}",
            f"<b>Generation Timestamp:</b> {now_str}",
        ]
        if extra_meta:
            meta_lines.insert(0, extra_meta)

        left_content = [
            Paragraph("GUESS THE WORD · ENTERPRISE ANALYTICS", self.style_brand),
            Paragraph(title, self.style_title),
            Paragraph("<br/>".join(meta_lines), self.style_meta),
        ]

        badge_p = Paragraph(
            f"<b>{badge_label}</b>",
            ParagraphStyle(
                "BadgeText",
                fontName="Helvetica-Bold",
                fontSize=7,
                leading=8.5,
                textColor=self.c_navy,
                alignment=TA_CENTER,
            ),
        )
        badge_table = Table([[badge_p]], colWidths=[125])
        badge_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), self.c_bg_subtle),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#BFDBFE")),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ])
        )

        header_table = Table(
            [[left_content, badge_table]],
            colWidths=[self.usable_width - 130, 130],
        )
        header_table.setStyle(
            TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ])
        )

        return [
            header_table,
            Spacer(1, 4),
            HRFlowable(width="100%", thickness=1, color=self.c_border, spaceBefore=0, spaceAfter=5),
        ]

    def _build_kpi_grid(self, metrics: List[Dict[str, str]], columns: int = 4) -> Table:
        """Create balanced grid of structured KPI cards with accent styling."""
        rows = []
        for i in range(0, len(metrics), columns):
            chunk = metrics[i : i + columns]
            row_cells = []
            for m in chunk:
                cell_content = [
                    Paragraph(m["label"].upper(), self.style_kpi_label),
                    Spacer(1, 1),
                    Paragraph(str(m["value"]), self.style_kpi_val),
                ]
                if "subtext" in m and m["subtext"]:
                    cell_content.extend([
                        Spacer(1, 0.5),
                        Paragraph(
                            m["subtext"],
                            ParagraphStyle(
                                "KpiSub",
                                fontName="Helvetica",
                                fontSize=5.8,
                                leading=7,
                                textColor=self.c_muted,
                            ),
                        ),
                    ])
                row_cells.append(cell_content)
            while len(row_cells) < columns:
                row_cells.append([])
            rows.append(row_cells)

        col_w = self.usable_width / columns
        kpi_table = Table(rows, colWidths=[col_w] * columns)
        kpi_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), self.c_bg_light),
                ("BOX", (0, 0), (-1, -1), 0.75, self.c_border),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, self.c_border),
                ("TOPPADDING", (0, 0), (-1, -1), 4.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ])
        )
        return kpi_table

    def _build_outcome_distribution_bar(
        self,
        won: int,
        lost: int,
        expired: int,
        active: int,
    ) -> Optional[Drawing]:
        """Render a clean, modern horizontal distribution bar displaying counts and percentages for all 4 outcomes."""
        total = won + lost + expired + active
        if total == 0:
            return None

        w = self.usable_width
        h = 38
        d = Drawing(w, h)

        pct_won = (won / total * 100.0)
        pct_lost = (lost / total * 100.0)
        pct_expired = (expired / total * 100.0)
        pct_active = (active / total * 100.0)

        # Title
        d.add(String(0, h - 8, "Match Outcome Distribution", fontName="Helvetica-Bold", fontSize=7.5, fillColor=self.c_primary))

        # Legend with explicit counts and percentages for all 4 outcomes
        leg_items = [
            (0, self.c_success, f"Won: {won} ({pct_won:.1f}%)"),
            (1, self.c_danger, f"Lost: {lost} ({pct_lost:.1f}%)"),
            (2, self.c_warning, f"Expired: {expired} ({pct_expired:.1f}%)"),
            (3, self.c_active, f"Active: {active} ({pct_active:.1f}%)"),
        ]

        for idx, col, text in leg_items:
            lx = 145 + (idx * 94)
            d.add(Rect(lx, h - 8, 6, 6, fillColor=col, strokeColor=None))
            d.add(String(lx + 8, h - 7, text, fontName="Helvetica-Bold", fontSize=6.2, fillColor=self.c_primary))

        # Stacked Bar
        bar_y = 4
        bar_h = 14
        cur_x = 0.0

        segments = [
            (won, self.c_success, f"{pct_won:.1f}%" if pct_won >= 6.0 else ""),
            (lost, self.c_danger, f"{pct_lost:.1f}%" if pct_lost >= 6.0 else ""),
            (expired, self.c_warning, f"{pct_expired:.1f}%" if pct_expired >= 6.0 else ""),
            (active, self.c_active, f"{pct_active:.1f}%" if pct_active >= 6.0 else ""),
        ]

        # Background track
        d.add(Rect(0, bar_y, w, bar_h, fillColor=colors.HexColor("#F1F5F9"), strokeColor=self.c_border, strokeWidth=0.5))

        for cnt, color, pct_lbl in segments:
            if cnt > 0:
                seg_w = (cnt / total) * w
                d.add(Rect(cur_x, bar_y, seg_w, bar_h, fillColor=color, strokeColor=None))
                if pct_lbl and seg_w > 20:
                    d.add(
                        String(
                            cur_x + (seg_w / 2),
                            bar_y + 3.8,
                            pct_lbl,
                            fontName="Helvetica-Bold",
                            fontSize=6.5,
                            fillColor=colors.white,
                            textAnchor="middle",
                        )
                    )
                cur_x += seg_w

        return d

    def _build_daily_activity_chart(self, summaries: List[Dict[str, Any]]) -> Optional[Drawing]:
        """
        Render a compact multi-day bar chart showing Started vs Won over time.
        Only rendered when summaries contain 2 or more distinct data points to avoid misleading line charts.
        """
        valid_summaries = [s for s in summaries if s.get("total_games", 0) > 0 or s.get("games_won", 0) > 0]
        if len(valid_summaries) < 2:
            return None

        # Sort chronologically for timeline chart
        sorted_summaries = sorted(
            valid_summaries,
            key=lambda x: x.get("date") if isinstance(x.get("date"), (date, datetime)) else str(x.get("date")),
        )
        # Limit to max 14 most recent days for clean spacing
        timeline = sorted_summaries[-14:]

        w = self.usable_width
        h = 70
        d = Drawing(w, h)

        # Title & Legend
        d.add(String(0, h - 8, "Gameplay Activity Trend (Started vs Won)", fontName="Helvetica-Bold", fontSize=7.5, fillColor=self.c_primary))

        # Legend
        d.add(Rect(w - 120, h - 8, 6, 6, fillColor=self.c_blue, strokeColor=None))
        d.add(String(w - 110, h - 7, "Started", fontName="Helvetica", fontSize=6.2, fillColor=self.c_primary))

        d.add(Rect(w - 60, h - 8, 6, 6, fillColor=self.c_success, strokeColor=None))
        d.add(String(w - 50, h - 7, "Won", fontName="Helvetica", fontSize=6.2, fillColor=self.c_primary))

        # Baseline
        d.add(Line(0, 14, w, 14, strokeColor=self.c_border, strokeWidth=0.75))

        num_points = len(timeline)
        slot_w = w / num_points
        max_val = max(max(s.get("total_games", 0) for s in timeline), 1)
        max_bar_h = 38

        for i, item in enumerate(timeline):
            started = item.get("total_games", 0)
            won = item.get("games_won", 0)
            d_val = item.get("date")
            d_lbl = d_val.strftime("%d %b") if isinstance(d_val, (date, datetime)) else str(d_val)[:6]

            slot_cx = i * slot_w + (slot_w / 2)
            bar_w = min(12, slot_w * 0.35)

            h_started = (started / max_val) * max_bar_h if max_val > 0 else 0
            h_won = (won / max_val) * max_bar_h if max_val > 0 else 0

            # Started Bar
            d.add(Rect(slot_cx - bar_w - 1, 14, bar_w, max(1, h_started), fillColor=self.c_blue, strokeColor=None))
            # Won Bar
            d.add(Rect(slot_cx + 1, 14, bar_w, max(1, h_won), fillColor=self.c_success, strokeColor=None))

            # Date Label
            d.add(String(slot_cx, 5, d_lbl, fontName="Helvetica", fontSize=5.5, fillColor=self.c_muted, textAnchor="middle"))

        return d

    def _build_attempts_distribution_chart(self, dist: Dict[str, int]) -> Optional[Drawing]:
        """Render a vertical bar chart of solved attempts distribution (1 to 6+)."""
        tot_won = sum(dist.values())
        if tot_won == 0:
            return None

        w = self.usable_width
        h = 68
        d = Drawing(w, h)

        d.add(String(0, h - 8, "Winning Attempts Distribution (1–6+ Attempts to Solve)", fontName="Helvetica-Bold", fontSize=7.5, fillColor=self.c_primary))
        d.add(Line(0, 14, w, 14, strokeColor=self.c_border, strokeWidth=0.75))

        labels = ["1 Attempt", "2 Attempts", "3 Attempts", "4 Attempts", "5 Attempts", "6+ Attempts"]
        keys = ["attempt_1", "attempt_2", "attempt_3", "attempt_4", "attempt_5", "attempt_gt5"]

        col_w = w / len(keys)
        max_val = max(max(dist.values()), 1)
        max_bar_h = 36

        for i, k in enumerate(keys):
            cnt = dist.get(k, 0)
            bar_h = (cnt / max_val) * max_bar_h if max_val > 0 else 0
            bar_w = min(26, col_w * 0.5)
            center_x = i * col_w + (col_w / 2)

            # Bar
            d.add(Rect(center_x - (bar_w / 2), 14, bar_w, max(1, bar_h), fillColor=self.c_blue, strokeColor=None))
            # Value label
            d.add(String(center_x, 14 + bar_h + 2.5, str(cnt), fontName="Helvetica-Bold", fontSize=6, fillColor=self.c_primary, textAnchor="middle"))
            # X label
            d.add(String(center_x, 5, labels[i], fontName="Helvetica", fontSize=5.8, fillColor=self.c_muted, textAnchor="middle"))

        return d

    def _render_wordle_tile_html(self, target_word: str, guess_word: str) -> str:
        """Render HTML styled text for Wordle guess tiles."""
        feedback = compute_letter_feedback(target_word, guess_word)
        tiles_html = []
        for ch, st in feedback:
            if st == "C":
                tiles_html.append(f'<font color="#059669"><b>[{ch}]</b></font>')
            elif st == "W":
                tiles_html.append(f'<font color="#D97706"><b>({ch})</b></font>')
            else:
                tiles_html.append(f'<font color="#64748B">{ch}</font>')
        return " ".join(tiles_html)

    def _build_methodology_section(self) -> Table:
        """Render a clean, corporate methodology and analytical definitions container."""
        content = [
            Paragraph("<b>REPORT METHODOLOGY & STATISTICAL RECONCILIATIONS</b>", ParagraphStyle(
                "MethTitle", fontName="Helvetica-Bold", fontSize=7, leading=9, textColor=self.c_navy
            )),
            Spacer(1, 2),
            Paragraph(
                "<b>1. Words Tried vs. Total Guesses:</b> 'Words Tried' (Games Started) represents unique game sessions initiated by players. 'Total Guesses' reflects individual word submissions across all attempts.<br/>"
                "<b>2. Dual Win Rate Reconciliations:</b><br/>"
                "&nbsp;&nbsp;• <i>Completed-Game Win Rate</i> = <code>Won / (Won + Lost + Expired) × 100%</code> (Excludes ongoing active games to measure true match resolution outcomes).<br/>"
                "&nbsp;&nbsp;• <i>Overall Win Rate</i> = <code>Won / Words Tried (Started) × 100%</code> (Measures victory frequency against all initiated game attempts).<br/>"
                "<b>3. Session States:</b> Reconciled as <code>Started = Won + Lost + Expired + Active</code>. Active sessions reflect ongoing matches within allowed time limits.<br/>"
                "<b>4. Data Governance & Security:</b> Records are sourced directly from persisted database entities with immutable audit records. Export timestamps are recorded in UTC.",
                self.style_method_body,
            ),
        ]
        tbl = Table([[content]], colWidths=[self.usable_width])
        tbl.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), self.c_bg_light),
                ("BOX", (0, 0), (-1, -1), 0.75, self.c_border),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ])
        )
        return tbl

    def generate_daily_report_pdf(
        self,
        summaries: List[Dict[str, Any]],
        participation: List[Dict[str, Any]],
        word_stats: List[Dict[str, Any]],
        sessions: List[Any],
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        target_date: Optional[date] = None,
        summary_only: bool = False,
        password: Optional[str] = None,
    ) -> io.BytesIO:
        """Generate comprehensive, multi-page Daily Gameplay and Activity Report."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=self.margin,
            rightMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin + 6,
        )

        elements: List[Any] = []
        period_str = self._format_period(start_date, end_date, target_date)

        # 1. Header
        elements.extend(
            self._build_header(
                title="Daily Gameplay & Activity Report",
                period_str=period_str,
                badge_label="DAILY ANALYTICS",
            )
        )

        # 2. Executive Summary Metrics Aggregation
        tot_unique_players = len(participation) if participation else sum(s.get("number_of_users", 0) for s in summaries)
        tot_games_started = sum(s.get("total_games", 0) for s in summaries)
        tot_won = sum(s.get("games_won", 0) for s in summaries)
        tot_lost = sum(s.get("games_lost", 0) for s in summaries)
        tot_expired = sum(s.get("games_expired", 0) for s in summaries)
        tot_active = sum(s.get("games_active", 0) for s in summaries)
        tot_completed = tot_won + tot_lost + tot_expired
        tot_guesses = sum(s.get("total_guesses", 0) for s in summaries)
        tot_correct_guesses = sum(s.get("number_of_correct_guesses", s.get("games_won", 0)) for s in summaries)

        completed_win_rate = (tot_won / tot_completed * 100.0) if tot_completed > 0 else 0.0
        overall_win_rate = (tot_won / tot_games_started * 100.0) if tot_games_started > 0 else 0.0

        metrics_row = [
            {"label": "Active Players", "value": str(tot_unique_players), "subtext": "Unique active participants"},
            {"label": "Games Started", "value": str(tot_games_started), "subtext": f"{tot_completed} finished, {tot_active} active"},
            {"label": "Completed Matches", "value": str(tot_completed), "subtext": f"{tot_won} won, {tot_lost+tot_expired} lost/exp"},
            {"label": "Active Sessions", "value": str(tot_active), "subtext": "In-progress games"},
            {"label": "Victories (Won)", "value": str(tot_won), "subtext": f"{tot_correct_guesses} correct words"},
            {"label": "Defeats / Expired", "value": str(tot_lost + tot_expired), "subtext": f"{tot_lost} lost, {tot_expired} expired"},
            {"label": "Completed Win Rate", "value": f"{completed_win_rate:.1f}%", "subtext": f"{tot_won} of {tot_completed} completed"},
            {"label": "Overall Win Rate", "value": f"{overall_win_rate:.1f}%", "subtext": f"{tot_won} of {tot_games_started} started"},
        ]

        elements.append(Paragraph("Executive Summary", self.style_section_title))
        elements.append(self._build_kpi_grid(metrics_row, columns=4))
        elements.append(Spacer(1, 4))

        # Outcome Distribution Bar
        dist_bar = self._build_outcome_distribution_bar(tot_won, tot_lost, tot_expired, tot_active)
        if dist_bar:
            elements.append(dist_bar)
            elements.append(Spacer(1, 4))

        # Optional Timeline Activity Chart (only if multi-day data is available)
        activity_chart = self._build_daily_activity_chart(summaries)
        if activity_chart:
            elements.append(activity_chart)
            elements.append(Spacer(1, 4))

        # 3. Daily Performance Statistics Table
        elements.append(Paragraph("Daily Gameplay Statistics", self.style_section_title))
        if not summaries:
            elements.append(
                Table(
                    [[Paragraph("No gameplay sessions recorded for the selected period.", self.style_empty)]],
                    colWidths=[self.usable_width],
                    style=[
                        ("BACKGROUND", (0, 0), (-1, -1), self.c_bg_light),
                        ("BOX", (0, 0), (-1, -1), 0.75, self.c_border),
                        ("TOPPADDING", (0, 0), (-1, -1), 8),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ],
                )
            )
        else:
            daily_table_data = [[
                Paragraph("Date", self.style_th),
                Paragraph("Players", self.style_th_right),
                Paragraph("Started", self.style_th_right),
                Paragraph("Won", self.style_th_right),
                Paragraph("Lost", self.style_th_right),
                Paragraph("Expired", self.style_th_right),
                Paragraph("Active", self.style_th_right),
                Paragraph("Guesses", self.style_th_right),
                Paragraph("Completed %", self.style_th_right),
                Paragraph("Overall %", self.style_th_right),
            ]]

            for idx, s in enumerate(summaries):
                d_val = s.get("date")
                d_str = d_val.strftime("%d %b %Y") if isinstance(d_val, (date, datetime)) else str(d_val)
                s_started = s.get("total_games", 0)
                s_won = s.get("games_won", 0)
                s_lost = s.get("games_lost", 0)
                s_exp = s.get("games_expired", 0)
                s_act = s.get("games_active", 0)
                s_comp = s_won + s_lost + s_exp

                c_win_rate = (s_won / s_comp * 100.0) if s_comp > 0 else 0.0
                o_win_rate = (s_won / s_started * 100.0) if s_started > 0 else 0.0

                daily_table_data.append([
                    Paragraph(d_str, self.style_td_bold),
                    Paragraph(str(s.get("number_of_users", 0)), self.style_td_right),
                    Paragraph(str(s_started), self.style_td_right),
                    Paragraph(str(s_won), self.style_td_right),
                    Paragraph(str(s_lost), self.style_td_right),
                    Paragraph(str(s_exp), self.style_td_right),
                    Paragraph(str(s_act), self.style_td_right),
                    Paragraph(str(s.get("total_guesses", 0)), self.style_td_right),
                    Paragraph(f"{c_win_rate:.1f}%", self.style_td_bold_right),
                    Paragraph(f"{o_win_rate:.1f}%", self.style_td_right),
                ])

            # Grand Total Summary Row
            daily_table_data.append([
                Paragraph("Grand Total", self.style_th),
                Paragraph(str(tot_unique_players), self.style_th_right),
                Paragraph(str(tot_games_started), self.style_th_right),
                Paragraph(str(tot_won), self.style_th_right),
                Paragraph(str(tot_lost), self.style_th_right),
                Paragraph(str(tot_expired), self.style_th_right),
                Paragraph(str(tot_active), self.style_th_right),
                Paragraph(str(tot_guesses), self.style_th_right),
                Paragraph(f"{completed_win_rate:.1f}%", self.style_th_right),
                Paragraph(f"{overall_win_rate:.1f}%", self.style_th_right),
            ])

            col_widths = [68, 38, 44, 38, 38, 42, 38, 48, 56, 53]
            daily_tbl = Table(daily_table_data, colWidths=col_widths, repeatRows=1)
            
            # Construct row backgrounds alternating
            t_styles = [
                ("BACKGROUND", (0, 0), (-1, 0), self.c_bg_subtle),
                ("BOX", (0, 0), (-1, -1), 0.75, self.c_border),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, self.c_border),
                ("BACKGROUND", (0, -1), (-1, -1), self.c_bg_alt),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
            for r_idx in range(1, len(daily_table_data) - 1):
                if r_idx % 2 == 0:
                    t_styles.append(("BACKGROUND", (0, r_idx), (-1, r_idx), self.c_bg_light))
            daily_tbl.setStyle(TableStyle(t_styles))
            elements.append(daily_tbl)

        elements.append(Spacer(1, 6))

        # 4. Player Participation Breakdown Table (With Active column)
        elements.append(Paragraph("Player Participation Breakdown", self.style_section_title))
        if not participation:
            elements.append(
                Table(
                    [[Paragraph("No active player sessions recorded for the period.", self.style_empty)]],
                    colWidths=[self.usable_width],
                    style=[
                        ("BACKGROUND", (0, 0), (-1, -1), self.c_bg_light),
                        ("BOX", (0, 0), (-1, -1), 0.75, self.c_border),
                        ("TOPPADDING", (0, 0), (-1, -1), 8),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ],
                )
            )
        else:
            p_data = [[
                Paragraph("Player", self.style_th),
                Paragraph("Role", self.style_th),
                Paragraph("Words Tried", self.style_th_right),
                Paragraph("Won", self.style_th_right),
                Paragraph("Lost", self.style_th_right),
                Paragraph("Expired", self.style_th_right),
                Paragraph("Active", self.style_th_right),
                Paragraph("Guesses", self.style_th_right),
                Paragraph("Completed %", self.style_th_right),
                Paragraph("Overall %", self.style_th_right),
            ]]

            for p in participation[:100]:
                c_wr = p.get("completed_win_rate", p.get("win_rate", 0.0))
                o_wr = p.get("overall_win_rate", p.get("win_rate", 0.0))

                p_data.append([
                    Paragraph(p.get("username", "Unknown"), self.style_td_bold),
                    Paragraph(p.get("role", "PLAYER"), self.style_td),
                    Paragraph(str(p.get("words_tried", 0)), self.style_td_right),
                    Paragraph(str(p.get("victories", 0)), self.style_td_right),
                    Paragraph(str(p.get("losses", 0)), self.style_td_right),
                    Paragraph(str(p.get("expired", 0)), self.style_td_right),
                    Paragraph(str(p.get("active", 0)), self.style_td_right),
                    Paragraph(str(p.get("total_guesses", 0)), self.style_td_right),
                    Paragraph(f"{c_wr:.1f}%", self.style_td_bold_right),
                    Paragraph(f"{o_wr:.1f}%", self.style_td_right),
                ])

            p_col_w = [82, 42, 52, 38, 38, 42, 40, 50, 56, 53]
            p_tbl = Table(p_data, colWidths=p_col_w, repeatRows=1)
            p_styles = [
                ("BACKGROUND", (0, 0), (-1, 0), self.c_bg_subtle),
                ("BOX", (0, 0), (-1, -1), 0.75, self.c_border),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, self.c_border),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
            for r_idx in range(1, len(p_data)):
                if r_idx % 2 == 0:
                    p_styles.append(("BACKGROUND", (0, r_idx), (-1, r_idx), self.c_bg_light))
            p_tbl.setStyle(TableStyle(p_styles))
            elements.append(p_tbl)

        elements.append(Spacer(1, 6))

        # 5. Target Word Statistics Table
        elements.append(Paragraph("Target Word Analytics", self.style_section_title))
        if not word_stats:
            elements.append(
                Table(
                    [[Paragraph("No word attempts recorded in this period.", self.style_empty)]],
                    colWidths=[self.usable_width],
                    style=[
                        ("BACKGROUND", (0, 0), (-1, -1), self.c_bg_light),
                        ("BOX", (0, 0), (-1, -1), 0.75, self.c_border),
                        ("TOPPADDING", (0, 0), (-1, -1), 8),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ],
                )
            )
        else:
            w_data = [[
                Paragraph("Target Word", self.style_th),
                Paragraph("Frequency", self.style_th_right),
                Paragraph("Won", self.style_th_right),
                Paragraph("Lost / Exp.", self.style_th_right),
                Paragraph("Active", self.style_th_right),
                Paragraph("Completed %", self.style_th_right),
                Paragraph("Overall %", self.style_th_right),
                Paragraph("Avg Attempts", self.style_th_right),
            ]]

            for w in word_stats[:100]:
                avg_str = f"{w['avg_attempts']:.1f}" if w.get("avg_attempts") is not None else "—"
                c_sr = w.get("completed_success_rate", w.get("success_rate", 0.0))
                o_sr = w.get("overall_success_rate", w.get("success_rate", 0.0))

                w_data.append([
                    Paragraph(f"<b>{w.get('word', '—').upper()}</b>", self.style_td),
                    Paragraph(str(w.get("frequency", 0)), self.style_td_right),
                    Paragraph(str(w.get("successful", 0)), self.style_td_right),
                    Paragraph(str(w.get("unsuccessful", 0)), self.style_td_right),
                    Paragraph(str(w.get("active", 0)), self.style_td_right),
                    Paragraph(f"{c_sr:.1f}%", self.style_td_bold_right),
                    Paragraph(f"{o_sr:.1f}%", self.style_td_right),
                    Paragraph(avg_str, self.style_td_right),
                ])

            w_col_w = [95, 52, 42, 58, 45, 65, 58, 70]
            w_tbl = Table(w_data, colWidths=w_col_w, repeatRows=1)
            w_styles = [
                ("BACKGROUND", (0, 0), (-1, 0), self.c_bg_subtle),
                ("BOX", (0, 0), (-1, -1), 0.75, self.c_border),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, self.c_border),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
                ("LEFTPADDING", (0, 0), (-1, -1), 3.5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3.5),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
            for r_idx in range(1, len(w_data)):
                if r_idx % 2 == 0:
                    w_styles.append(("BACKGROUND", (0, r_idx), (-1, r_idx), self.c_bg_light))
            w_tbl.setStyle(TableStyle(w_styles))
            elements.append(w_tbl)

        # 6. Detailed Game Session Logs
        if not summary_only and sessions:
            elements.append(Spacer(1, 8))
            elements.append(Paragraph(f"Detailed Match Session Logs ({len(sessions)} Records)", self.style_section_title))

            sess_data = [[
                Paragraph("Match #", self.style_th),
                Paragraph("Player", self.style_th),
                Paragraph("Target Word", self.style_th),
                Paragraph("Started At", self.style_th),
                Paragraph("Status", self.style_th),
                Paragraph("Attempts", self.style_th_center),
                Paragraph("Submitted Guesses (Chronological)", self.style_th),
            ]]

            for s in sessions[:300]:
                s_id = f"#{s.id}"
                player_name = s.player.username if s.player else f"User #{s.player_id}"
                target_w = s.word.word.upper() if s.word else "N/A"
                started_str = s.started_at.strftime("%d %b %H:%M") if s.started_at else "—"

                st_val = s.status.value if hasattr(s.status, "value") else str(s.status)
                if st_val == "WON":
                    status_p = Paragraph('<font color="#059669"><b>Won</b></font>', self.style_td)
                elif st_val == "LOST":
                    status_p = Paragraph('<font color="#DC2626"><b>Lost</b></font>', self.style_td)
                elif st_val == "EXPIRED":
                    status_p = Paragraph('<font color="#D97706"><b>Expired</b></font>', self.style_td)
                else:
                    status_p = Paragraph('<font color="#4F46E5">Active</font>', self.style_td)

                attempts_str = f"{s.attempts_used}/{s.max_attempts}"
                guesses_list = [g.guess.upper() for g in s.guesses] if s.guesses else []
                guesses_str = " → ".join(guesses_list) if guesses_list else "—"

                sess_data.append([
                    Paragraph(s_id, self.style_td_bold),
                    Paragraph(player_name, self.style_td),
                    Paragraph(f"<b>{target_w}</b>", self.style_td),
                    Paragraph(started_str, self.style_td),
                    status_p,
                    Paragraph(attempts_str, self.style_td_center),
                    Paragraph(guesses_str, self.style_td),
                ])

            sess_col_w = [42, 68, 58, 68, 46, 46, 155]
            sess_tbl = Table(sess_data, colWidths=sess_col_w, repeatRows=1)
            sess_styles = [
                ("BACKGROUND", (0, 0), (-1, 0), self.c_bg_subtle),
                ("BOX", (0, 0), (-1, -1), 0.75, self.c_border),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, self.c_border),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
            for r_idx in range(1, len(sess_data)):
                if r_idx % 2 == 0:
                    sess_styles.append(("BACKGROUND", (0, r_idx), (-1, r_idx), self.c_bg_light))
            sess_tbl.setStyle(TableStyle(sess_styles))
            elements.append(sess_tbl)

        # 7. Methodology & Definitions Section (Sized compactly with KeepTogether)
        elements.append(Spacer(1, 8))
        elements.append(KeepTogether([self._build_methodology_section()]))

        # Build Document
        doc.build(elements, canvasmaker=NumberedCanvas)
        return encrypt_pdf_buffer(buffer, password)

    def generate_player_report_pdf(
        self,
        username: str,
        role: str,
        user_obj: Optional[Any],
        lifetime_stats: Dict[str, Any],
        period_stats: Dict[str, Any],
        daily_records: List[Dict[str, Any]],
        attempts_dist: Dict[str, int],
        sessions: List[Any],
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        target_date: Optional[date] = None,
        summary_only: bool = False,
        password: Optional[str] = None,
    ) -> io.BytesIO:
        """Generate Complete Player Performance & Profile Analytical Report."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=self.margin,
            rightMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin + 6,
        )

        elements: List[Any] = []
        period_str = self._format_period(start_date, end_date, target_date)

        # 1. Header & Profile Banner
        created_str = user_obj.created_at.strftime("%d %B %Y") if user_obj and getattr(user_obj, "created_at", None) else "—"
        last_act = lifetime_stats.get("last_active_at")
        last_act_str = last_act.strftime("%d %b %Y at %H:%M UTC") if isinstance(last_act, (date, datetime)) else "—"

        user_status = "Active"
        if user_obj:
            if getattr(user_obj, "is_deleted", False):
                user_status = "Deleted"
            elif getattr(user_obj, "is_suspended", False):
                user_status = "Suspended"
            elif not getattr(user_obj, "is_active", True):
                user_status = "Inactive"

        profile_meta = (
            f"<b>Player:</b> {username} · <b>Role:</b> {role} · <b>Status:</b> {user_status}<br/>"
            f"<b>Registered:</b> {created_str} · <b>Last Active:</b> {last_act_str}"
        )

        elements.extend(
            self._build_header(
                title=f"Player Performance Dossier: {username}",
                period_str=period_str,
                extra_meta=profile_meta,
                badge_label="PLAYER DOSSIER",
            )
        )

        # 2. Performance KPI Grid (Lifetime vs Period)
        elements.append(Paragraph("Performance Overview", self.style_section_title))

        p_tot = period_stats.get("total_games", 0)
        p_won = period_stats.get("games_won", 0)
        p_lost = period_stats.get("games_lost", 0)
        p_comp = p_won + p_lost
        p_comp_wr = (p_won / p_comp * 100.0) if p_comp > 0 else 0.0
        p_overall_wr = period_stats.get("win_rate", 0.0)

        l_tot = lifetime_stats.get("total_games", 0)
        l_won = lifetime_stats.get("games_won", 0)
        l_comp = l_won + lifetime_stats.get("games_lost", 0) + lifetime_stats.get("games_expired", 0)
        l_comp_wr = (l_won / l_comp * 100.0) if l_comp > 0 else 0.0

        kpi_metrics = [
            {"label": "Period Matches", "value": str(p_tot), "subtext": f"{p_won} won, {p_lost} lost"},
            {"label": "Completed Win %", "value": f"{p_comp_wr:.1f}%", "subtext": f"{p_won} of {p_comp} finished"},
            {"label": "Overall Win %", "value": f"{p_overall_wr:.1f}%", "subtext": f"{p_won} of {p_tot} started"},
            {"label": "Current Streak", "value": f"{lifetime_stats.get('current_streak', 0)} Wins", "subtext": f"Max streak: {lifetime_stats.get('max_streak', 0)} wins"},
            {"label": "Lifetime Matches", "value": str(l_tot), "subtext": f"{l_won} all-time victories"},
            {"label": "Lifetime Win %", "value": f"{l_comp_wr:.1f}%", "subtext": f"{l_won} of {l_comp} completed"},
            {"label": "Lifetime Guesses", "value": str(lifetime_stats.get("total_guesses", 0)), "subtext": "Total submissions"},
            {"label": "Avg Attempts / Win", "value": f"{lifetime_stats.get('average_attempts') or '—'}", "subtext": "Attempts to solve words"},
        ]

        elements.append(self._build_kpi_grid(kpi_metrics, columns=4))
        elements.append(Spacer(1, 4))

        # 3. Attempts Distribution Analysis Chart
        elements.append(Paragraph("Winning Attempts Distribution", self.style_section_title))
        att_chart = self._build_attempts_distribution_chart(attempts_dist)
        if att_chart:
            elements.append(att_chart)
            elements.append(Spacer(1, 4))
        else:
            elements.append(
                Table(
                    [[Paragraph("No completed winning matches in this period to display attempt distribution.", self.style_empty)]],
                    colWidths=[self.usable_width],
                    style=[
                        ("BACKGROUND", (0, 0), (-1, -1), self.c_bg_light),
                        ("BOX", (0, 0), (-1, -1), 0.75, self.c_border),
                        ("TOPPADDING", (0, 0), (-1, -1), 8),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ],
                )
            )
            elements.append(Spacer(1, 4))

        # 4. Daily Performance Table
        elements.append(Paragraph("Daily Activity History", self.style_section_title))
        if not daily_records:
            elements.append(
                Table(
                    [[Paragraph("No daily records recorded for this player in the selected period.", self.style_empty)]],
                    colWidths=[self.usable_width],
                    style=[
                        ("BACKGROUND", (0, 0), (-1, -1), self.c_bg_light),
                        ("BOX", (0, 0), (-1, -1), 0.75, self.c_border),
                        ("TOPPADDING", (0, 0), (-1, -1), 8),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ],
                )
            )
        else:
            daily_data = [[
                Paragraph("Date", self.style_th),
                Paragraph("Words Tried", self.style_th_right),
                Paragraph("Correct Guesses", self.style_th_right),
                Paragraph("Total Guesses", self.style_th_right),
                Paragraph("Defeats / Expired", self.style_th_right),
                Paragraph("Completed %", self.style_th_right),
                Paragraph("Overall %", self.style_th_right),
            ]]

            for rec in daily_records:
                d_val = rec.get("date")
                d_str = d_val.strftime("%d %b %Y") if isinstance(d_val, (date, datetime)) else str(d_val)
                r_tot = rec.get("words_tried", rec.get("total_games", 0))
                r_won = rec.get("correct_guesses", rec.get("games_won", 0))
                unsucc = max(0, r_tot - r_won)
                r_comp = r_won + unsucc
                c_wr = (r_won / r_comp * 100.0) if r_comp > 0 else 0.0
                o_wr = (r_won / r_tot * 100.0) if r_tot > 0 else 0.0

                daily_data.append([
                    Paragraph(d_str, self.style_td_bold),
                    Paragraph(str(r_tot), self.style_td_right),
                    Paragraph(str(r_won), self.style_td_right),
                    Paragraph(str(rec.get("total_guesses", 0)), self.style_td_right),
                    Paragraph(str(unsucc), self.style_td_right),
                    Paragraph(f"{c_wr:.1f}%", self.style_td_bold_right),
                    Paragraph(f"{o_wr:.1f}%", self.style_td_right),
                ])

            daily_col_w = [95, 70, 75, 70, 80, 68, 65]
            daily_tbl = Table(daily_data, colWidths=daily_col_w, repeatRows=1)
            d_styles = [
                ("BACKGROUND", (0, 0), (-1, 0), self.c_bg_subtle),
                ("BOX", (0, 0), (-1, -1), 0.75, self.c_border),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, self.c_border),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
                ("LEFTPADDING", (0, 0), (-1, -1), 3.5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3.5),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
            for r_idx in range(1, len(daily_data)):
                if r_idx % 2 == 0:
                    d_styles.append(("BACKGROUND", (0, r_idx), (-1, r_idx), self.c_bg_light))
            daily_tbl.setStyle(TableStyle(d_styles))
            elements.append(daily_tbl)

        # 5. Complete Match History & Per-Letter Guess Feedback
        if not summary_only and sessions:
            elements.append(Spacer(1, 8))
            elements.append(Paragraph(f"Complete Match History & Guess Inspection ({len(sessions)} Matches)", self.style_section_title))

            legend_html = (
                '<b>Letter Feedback Legend:</b> '
                '<font color="#059669"><b>[G] Green = Correct Position</b></font> · '
                '<font color="#D97706"><b>(Y) Amber = Present in Word</b></font> · '
                '<font color="#64748B">A Slate = Absent</font>'
            )
            elements.append(
                Table(
                    [[Paragraph(legend_html, ParagraphStyle("Leg", fontName="Helvetica", fontSize=6.2, leading=8, textColor=self.c_muted))]],
                    colWidths=[self.usable_width],
                    style=[
                        ("BACKGROUND", (0, 0), (-1, -1), self.c_bg_light),
                        ("BOX", (0, 0), (-1, -1), 0.5, self.c_border),
                        ("TOPPADDING", (0, 0), (-1, -1), 3),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                        ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ],
                )
            )
            elements.append(Spacer(1, 4))

            matches_table_data = [[
                Paragraph("Match", self.style_th),
                Paragraph("Target Word", self.style_th),
                Paragraph("Date & Time", self.style_th),
                Paragraph("Duration", self.style_th),
                Paragraph("Result", self.style_th),
                Paragraph("Attempts", self.style_th_center),
                Paragraph("Chronological Guesses with Tile Feedback", self.style_th),
            ]]

            for s in sessions[:300]:
                match_num = f"#{s.id}"
                target_w = s.word.word.upper() if s.word else "N/A"
                date_str = s.started_at.strftime("%d %b %Y %H:%M") if s.started_at else "—"

                dur_str = "—"
                if s.started_at and s.completed_at:
                    dur_sec = max(0, int((s.completed_at - s.started_at).total_seconds()))
                    mins = dur_sec // 60
                    secs = dur_sec % 60
                    dur_str = f"{mins}m {secs}s" if mins > 0 else f"{secs}s"

                st_val = s.status.value if hasattr(s.status, "value") else str(s.status)
                if st_val == "WON":
                    res_p = Paragraph('<font color="#059669"><b>Won</b></font>', self.style_td)
                elif st_val == "LOST":
                    res_p = Paragraph('<font color="#DC2626"><b>Lost</b></font>', self.style_td)
                elif st_val == "EXPIRED":
                    res_p = Paragraph('<font color="#D97706"><b>Expired</b></font>', self.style_td)
                else:
                    res_p = Paragraph('<font color="#4F46E5">Active</font>', self.style_td)

                attempts_str = f"{s.attempts_used} / {s.max_attempts}"

                guess_lines = []
                if s.guesses:
                    for g in s.guesses:
                        g_text = g.guess.upper()
                        tiles_rendered = self._render_wordle_tile_html(target_w, g_text)
                        guess_lines.append(f"{g.attempt_number}. {tiles_rendered}")
                guess_cell_html = "<br/>".join(guess_lines) if guess_lines else "<i>No guesses submitted</i>"

                matches_table_data.append([
                    Paragraph(match_num, self.style_td_bold),
                    Paragraph(f"<b>{target_w}</b>", self.style_td),
                    Paragraph(date_str, self.style_td),
                    Paragraph(dur_str, self.style_td),
                    res_p,
                    Paragraph(attempts_str, self.style_td_center),
                    Paragraph(guess_cell_html, self.style_td),
                ])

            m_col_w = [36, 52, 65, 42, 40, 42, 246]
            matches_tbl = Table(matches_table_data, colWidths=m_col_w, repeatRows=1)
            m_styles = [
                ("BACKGROUND", (0, 0), (-1, 0), self.c_bg_subtle),
                ("BOX", (0, 0), (-1, -1), 0.75, self.c_border),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, self.c_border),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
            for r_idx in range(1, len(matches_table_data)):
                if r_idx % 2 == 0:
                    m_styles.append(("BACKGROUND", (0, r_idx), (-1, r_idx), self.c_bg_light))
            matches_tbl.setStyle(TableStyle(m_styles))
            elements.append(matches_tbl)

        # 6. Methodology & Definitions Section
        elements.append(Spacer(1, 8))
        elements.append(KeepTogether([self._build_methodology_section()]))

        # Build Document
        doc.build(elements, canvasmaker=NumberedCanvas)
        return encrypt_pdf_buffer(buffer, password)
