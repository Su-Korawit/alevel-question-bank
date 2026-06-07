import katex from 'katex';

interface Props {
  text: string;
  className?: string;
}

// Split on $$...$$ (display) then $...$ (inline)
function parseSegments(text: string): Array<{ type: 'text' | 'inline' | 'display'; content: string }> {
  const segments: Array<{ type: 'text' | 'inline' | 'display'; content: string }> = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Check for display math $$...$$
    const displayMatch = remaining.match(/\$\$([\s\S]*?)\$\$/);
    // Check for inline math $...$
    const inlineMatch = remaining.match(/\$((?:[^$]|\\\$)*?)\$/);

    if (!displayMatch && !inlineMatch) {
      segments.push({ type: 'text', content: remaining });
      break;
    }

    // Pick whichever comes first
    const displayIdx = displayMatch ? remaining.indexOf(displayMatch[0]) : Infinity;
    const inlineIdx = inlineMatch ? remaining.indexOf(inlineMatch[0]) : Infinity;

    if (displayIdx <= inlineIdx && displayMatch) {
      if (displayIdx > 0) segments.push({ type: 'text', content: remaining.slice(0, displayIdx) });
      segments.push({ type: 'display', content: displayMatch[1] });
      remaining = remaining.slice(displayIdx + displayMatch[0].length);
    } else if (inlineMatch) {
      if (inlineIdx > 0) segments.push({ type: 'text', content: remaining.slice(0, inlineIdx) });
      segments.push({ type: 'inline', content: inlineMatch[1] });
      remaining = remaining.slice(inlineIdx + inlineMatch[0].length);
    }
  }

  return segments;
}

function renderSegment(seg: { type: 'text' | 'inline' | 'display'; content: string }, key: number) {
  if (seg.type === 'text') {
    return <span key={key}>{seg.content}</span>;
  }
  try {
    const html = katex.renderToString(seg.content, {
      throwOnError: false,
      displayMode: seg.type === 'display',
    });
    return (
      <span
        key={key}
        dangerouslySetInnerHTML={{ __html: html }}
        style={seg.type === 'display' ? { display: 'block', textAlign: 'center', margin: '0.5em 0' } : undefined}
      />
    );
  } catch {
    return <span key={key} style={{ color: 'red' }}>{seg.content}</span>;
  }
}

export function LatexRenderer({ text, className }: Props) {
  const segments = parseSegments(text);
  return (
    <span className={className}>
      {segments.map((seg, i) => renderSegment(seg, i))}
    </span>
  );
}
