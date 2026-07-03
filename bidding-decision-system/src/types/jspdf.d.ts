declare module 'jspdf' {
  class jsPDF {
    internal: {
      pageSize: {
        getWidth(): number;
        getHeight(): number;
      };
    };
    constructor(orientation?: string, unit?: string, format?: string);
    setFontSize(size: number): void;
    setTextColor(r: number, g: number, b: number): void;
    setFont(family?: string, style?: string): void;
    text(text: string | string[], x: number, y: number, options?: { align?: string }): void;
    setFillColor(r: number, g: number, b: number): void;
    rect(x: number, y: number, width: number, height: number, style?: string): void;
    addPage(): void;
    output(type: string): ArrayBuffer;
  }
  export default jsPDF;
}

declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface AutoTableOptions {
    startY?: number;
    head?: string[][];
    body?: string[][];
    margin?: { left: number; right: number };
    styles?: { fontSize?: number; cellPadding?: number };
    headStyles?: { fillColor?: number[]; textColor?: number[] };
    alternateRowStyles?: { fillColor?: number[] };
  }

  function autoTable(doc: jsPDF, options: AutoTableOptions): void;
  export default autoTable;
}
