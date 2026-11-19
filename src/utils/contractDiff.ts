import * as pdfjsLib from 'pdfjs-dist';

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

export interface PageDiffResult {
  v1Lines: string[];
  v2Lines: string[];
  diffs: DiffLine[];
  addedCount: number;
  removedCount: number;
}

/**
 * Extract clean line-by-line text from a specific PDF page
 */
export async function getPageTextLines(pdfBytes: ArrayBuffer, pageNumber: number): Promise<string[]> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const doc = await loadingTask.promise;
  if (pageNumber > doc.numPages) return [];
  const page = await doc.getPage(pageNumber);
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1.0 });

  // Group items by vertical position
  const items: { text: string; y: number; x: number }[] = [];
  for (const item of textContent.items as any[]) {
    if (!item.str || item.str.trim() === '') continue;
    items.push({
      text: item.str.trim(),
      y: Math.round(viewport.height - item.transform[5]),
      x: item.transform[4],
    });
  }

  // Sort top-to-bottom
  items.sort((a, b) => a.y - b.y);

  const lines: string[] = [];
  let currentLine: { text: string; x: number }[] = [];
  let currentY = items[0]?.y ?? 0;

  for (const it of items) {
    if (Math.abs(it.y - currentY) < 6) {
      currentLine.push(it);
    } else {
      currentLine.sort((a, b) => a.x - b.x);
      lines.push(currentLine.map((c) => c.text).join(' '));
      currentLine = [it];
      currentY = it.y;
    }
  }
  if (currentLine.length > 0) {
    currentLine.sort((a, b) => a.x - b.x);
    lines.push(currentLine.map((c) => c.text).join(' '));
  }

  return lines;
}

/**
 * Compute line-by-line diff between two text arrays (LCS algorithm)
 */
export function computeLineDiff(lines1: string[], lines2: string[]): PageDiffResult {
  const m = lines1.length;
  const n = lines2.length;

  // Build LCS matrix
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (lines1[i - 1].trim() === lines2[j - 1].trim()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const diffs: DiffLine[] = [];
  let i = m;
  let j = n;
  let addedCount = 0;
  let removedCount = 0;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1].trim() === lines2[j - 1].trim()) {
      diffs.unshift({ type: 'unchanged', text: lines1[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffs.unshift({ type: 'added', text: lines2[j - 1] });
      addedCount++;
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diffs.unshift({ type: 'removed', text: lines1[i - 1] });
      removedCount++;
      i--;
    }
  }

  return {
    v1Lines: lines1,
    v2Lines: lines2,
    diffs,
    addedCount,
    removedCount,
  };
}
