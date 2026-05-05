import { rgb, PDFFont } from 'pdf-lib';
import { PdfRenderContext } from '../../../types/contract.types.js';

// ---------------------------------------------------------------------------
// Low-level pdf-lib drawing primitives shared by the contract renderer.
// They mutate the PdfRenderContext (current page + cursor) in place and
// transparently handle page breaks via ensureSpace.
// ---------------------------------------------------------------------------

export function ensureSpace(ctx: PdfRenderContext, needed: number): void {
  if (ctx.y < needed + 60) {
    ctx.currentPage = ctx.pdfDoc.addPage([ctx.pageWidth, ctx.pageHeight]);
    ctx.y = ctx.pageHeight - 60;
  }
}

/** Wraps text to fit within maxWidth, returns array of lines */
export function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/** Draws a single line of text */
export function drawLine(
  ctx: PdfRenderContext,
  text: string,
  fontSize = 11,
  isBold = false,
  x?: number,
): void {
  ensureSpace(ctx, ctx.lineHeight);
  ctx.currentPage.drawText(text, {
    x: x ?? ctx.leftMargin,
    y: ctx.y,
    size: fontSize,
    font: isBold ? ctx.boldFont : ctx.font,
    color: rgb(0, 0, 0),
  });
  ctx.y -= ctx.lineHeight;
}

/** Draws wrapped paragraph text with automatic page breaks */
export function drawParagraph(
  ctx: PdfRenderContext,
  text: string,
  fontSize = 11,
  isBold = false,
  indent = 0,
): void {
  const maxWidth = ctx.pageWidth - ctx.leftMargin - ctx.rightMargin - indent;
  const theFont = isBold ? ctx.boldFont : ctx.font;
  const lines = wrapText(text, theFont, fontSize, maxWidth);
  for (const line of lines) {
    ensureSpace(ctx, ctx.lineHeight);
    ctx.currentPage.drawText(line, {
      x: ctx.leftMargin + indent,
      y: ctx.y,
      size: fontSize,
      font: theFont,
      color: rgb(0, 0, 0),
    });
    ctx.y -= ctx.lineHeight;
  }
}

/** Draws a bold prefix followed by regular text, both word-wrapped together */
export function drawLabeledParagraph(
  ctx: PdfRenderContext,
  boldPrefix: string,
  regularText: string,
  fontSize = 11,
  indent = 0,
): void {
  const fullText = boldPrefix + regularText;
  const maxWidth = ctx.pageWidth - ctx.leftMargin - ctx.rightMargin - indent;
  const lines = wrapText(fullText, ctx.font, fontSize, maxWidth);

  for (let i = 0; i < lines.length; i++) {
    ensureSpace(ctx, ctx.lineHeight);
    const line = lines[i];

    // For first line, draw bold prefix separately if it fits
    if (i === 0 && line.startsWith(boldPrefix)) {
      const boldWidth = ctx.boldFont.widthOfTextAtSize(boldPrefix, fontSize);
      ctx.currentPage.drawText(boldPrefix, {
        x: ctx.leftMargin + indent,
        y: ctx.y,
        size: fontSize,
        font: ctx.boldFont,
        color: rgb(0, 0, 0),
      });
      const rest = line.slice(boldPrefix.length);
      if (rest) {
        ctx.currentPage.drawText(rest, {
          x: ctx.leftMargin + indent + boldWidth,
          y: ctx.y,
          size: fontSize,
          font: ctx.font,
          color: rgb(0, 0, 0),
        });
      }
    } else {
      ctx.currentPage.drawText(line, {
        x: ctx.leftMargin + indent,
        y: ctx.y,
        size: fontSize,
        font: ctx.font,
        color: rgb(0, 0, 0),
      });
    }
    ctx.y -= ctx.lineHeight;
  }
}

/** Draws a simple table with borders */
export function drawTable(
  ctx: PdfRenderContext,
  headers: string[],
  rows: string[][],
  colWidths: number[],
  _highlightRow?: number, // deprecated — use highlightRows
  highlightRows?: Set<number>,
): void {
  const rowHeight = 16;
  const cellPadding = 3;
  const fontSize = 8;
  const startX = ctx.leftMargin;

  // Check if we need a new page for the entire header + at least a few rows
  ensureSpace(ctx, rowHeight * Math.min(rows.length + 1, 5));

  // Draw header row
  let x = startX;
  for (let c = 0; c < headers.length; c++) {
    ctx.currentPage.drawRectangle({
      x,
      y: ctx.y - rowHeight + cellPadding,
      width: colWidths[c],
      height: rowHeight,
      color: rgb(0.93, 0.93, 0.93),
      borderColor: rgb(0.2, 0.2, 0.2),
      borderWidth: 0.5,
    });
    const headerLines = wrapText(headers[c], ctx.boldFont, fontSize, colWidths[c] - 2 * cellPadding);
    ctx.currentPage.drawText(headerLines[0] ?? '', {
      x: x + cellPadding,
      y: ctx.y - rowHeight + cellPadding + 4,
      size: fontSize,
      font: ctx.boldFont,
      color: rgb(0, 0, 0),
    });
    x += colWidths[c];
  }
  ctx.y -= rowHeight;

  // Draw data rows
  for (let r = 0; r < rows.length; r++) {
    ensureSpace(ctx, rowHeight);
    x = startX;
    const isHighlighted = _highlightRow === r || (highlightRows?.has(r) ?? false);
    for (let c = 0; c < rows[r].length; c++) {
      ctx.currentPage.drawRectangle({
        x,
        y: ctx.y - rowHeight + cellPadding,
        width: colWidths[c],
        height: rowHeight,
        color: isHighlighted ? rgb(0.9, 0.95, 1.0) : rgb(1, 1, 1),
        borderColor: rgb(0.2, 0.2, 0.2),
        borderWidth: 0.5,
      });
      ctx.currentPage.drawText(rows[r][c] ?? '', {
        x: x + cellPadding,
        y: ctx.y - rowHeight + cellPadding + 4,
        size: fontSize,
        font: isHighlighted ? ctx.boldFont : ctx.font,
        color: rgb(0, 0, 0),
      });
      x += colWidths[c];
    }
    ctx.y -= rowHeight;
  }
  ctx.y -= 6;
}

/** Draws a horizontal signature line with a label */
export function drawSignatureLine(
  ctx: PdfRenderContext,
  label: string,
  sublabel: string,
): void {
  ensureSpace(ctx, 50);
  ctx.y -= 30;
  const centerX = ctx.pageWidth / 2;
  const lineWidth = 250;

  ctx.currentPage.drawLine({
    start: { x: centerX - lineWidth / 2, y: ctx.y },
    end: { x: centerX + lineWidth / 2, y: ctx.y },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });

  const labelWidth = ctx.boldFont.widthOfTextAtSize(label, 10);
  ctx.currentPage.drawText(label, {
    x: centerX - labelWidth / 2,
    y: ctx.y - 14,
    size: 10,
    font: ctx.boldFont,
    color: rgb(0, 0, 0),
  });

  const subWidth = ctx.font.widthOfTextAtSize(sublabel, 9);
  ctx.currentPage.drawText(sublabel, {
    x: centerX - subWidth / 2,
    y: ctx.y - 26,
    size: 9,
    font: ctx.font,
    color: rgb(0, 0, 0),
  });

  ctx.y -= 36;
}
