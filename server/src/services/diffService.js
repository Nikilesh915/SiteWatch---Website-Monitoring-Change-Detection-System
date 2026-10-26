import * as diff from 'diff';

/**
 * Computes line-by-line differences between two text versions
 */
export const computeDiff = (oldText = '', newText = '') => {
  if (oldText === newText) {
    return {
      hasChanges: false,
      summary: 'No changes detected',
      addedLinesCount: 0,
      deletedLinesCount: 0,
      percentageChange: 0,
      diffChunks: [],
    };
  }

  const lineDiff = diff.diffLines(oldText, newText, {
    ignoreWhitespace: false,
  });

  let addedLinesCount = 0;
  let deletedLinesCount = 0;
  let unchangedLinesCount = 0;

  const diffChunks = lineDiff.map(part => {
    // Count lines in this part
    const lines = part.value.split('\n').filter(l => l.length > 0);
    const lineCount = lines.length || 1;

    let type = 'unchanged';
    if (part.added) {
      type = 'added';
      addedLinesCount += lineCount;
    } else if (part.removed) {
      type = 'removed';
      deletedLinesCount += lineCount;
    } else {
      unchangedLinesCount += lineCount;
    }

    return {
      type,
      content: part.value,
      lineCount,
    };
  });

  const totalLines = Math.max(1, addedLinesCount + deletedLinesCount + unchangedLinesCount);
  const changedLines = addedLinesCount + deletedLinesCount;
  const percentageChange = Number(((changedLines / totalLines) * 100).toFixed(1));

  let summaryParts = [];
  if (addedLinesCount > 0) summaryParts.push(`+${addedLinesCount} added`);
  if (deletedLinesCount > 0) summaryParts.push(`-${deletedLinesCount} removed`);
  const summary = summaryParts.length > 0 ? summaryParts.join(', ') : 'Content updated';

  return {
    hasChanges: changedLines > 0,
    summary,
    addedLinesCount,
    deletedLinesCount,
    percentageChange,
    diffChunks,
  };
};

/**
 * Creates a quick preview snippet of changes for email alerts
 */
export const createDiffSnippet = (diffChunks, maxLines = 10) => {
  const changedParts = diffChunks.filter(c => c.type !== 'unchanged');
  const snippetLines = [];

  for (const part of changedParts) {
    const prefix = part.type === 'added' ? '+ ' : '- ';
    const lines = part.content.split('\n').filter(l => l.trim().length > 0);
    
    for (const line of lines) {
      if (snippetLines.length >= maxLines) {
        snippetLines.push('... (more changes in dashboard)');
        return snippetLines.join('\n');
      }
      snippetLines.push(prefix + line);
    }
  }

  return snippetLines.join('\n');
};
