"use client";

/** Prints the page; the print styles strip everything but the sheet. */
export function PrintButton() {
  return (
    <button type="button" className="btn primary sheet-print" onClick={() => window.print()}>
      Print this sheet
    </button>
  );
}
