import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { HistoryItem, Project } from '../../types';

export class ExportService {
  /**
   * Export Plotly graph element as PNG or SVG
   */
  static async exportPlotlyGraph(
    graphDivId: string,
    format: 'png' | 'svg' = 'png',
    filename: string = 'mathvision-graph'
  ): Promise<void> {
    const el = document.getElementById(graphDivId);
    if (!el) {
      console.warn(`Element #${graphDivId} not found for export.`);
      return;
    }

    // @ts-ignore
    if (window.Plotly && typeof window.Plotly.toImage === 'function') {
      try {
        // @ts-ignore
        const dataUrl = await window.Plotly.toImage(el, {
          format,
          width: 1200,
          height: 800,
        });
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${filename}.${format}`;
        a.click();
        return;
      } catch (err) {
        console.error('Plotly toImage failed, falling back to html2canvas:', err);
      }
    }

    // Fallback: html2canvas
    try {
      const canvas = await html2canvas(el, { backgroundColor: '#0B1020', scale: 2 });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${filename}.png`;
      a.click();
    } catch (err) {
      console.error('Canvas export failed:', err);
    }
  }

  /**
   * Export 3D WebGL Canvas as PNG
   */
  static exportCanvasPNG(canvasElement: HTMLCanvasElement, filename: string = 'mathvision-3d'): void {
    try {
      const dataUrl = canvasElement.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${filename}.png`;
      a.click();
    } catch (err) {
      console.error('Failed to export canvas:', err);
    }
  }

  /**
   * Export project as JSON
   */
  static exportProjectJSON(project: Project): void {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}_project.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export calculation history as CSV
   */
  static exportHistoryCSV(history: HistoryItem[]): void {
    if (history.length === 0) return;

    const headers = ['Timestamp', 'Date', 'Category', 'Input', 'Result'];
    const rows = history.map((item) => [
      item.timestamp,
      new Date(item.timestamp).toISOString(),
      `"${item.category.replace(/"/g, '""')}"`,
      `"${item.input.replace(/"/g, '""')}"`,
      `"${item.result.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mathvision_history_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export HTML report as PDF
   */
  static async exportReportPDF(
    elementId: string,
    title: string = 'MathVision Mathematical Report'
  ): Promise<void> {
    const el = document.getElementById(elementId);
    if (!el) return;

    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#0B1020' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF generation error, falling back to window.print():', err);
      window.print();
    }
  }
}
