import { useState, useMemo } from 'react';
import './JsonViewer.css';

interface JsonViewerProps {
  data: unknown;
  maxInitialDepth?: number;
}

export function JsonViewer({ data, maxInitialDepth = 2 }: JsonViewerProps) {
  const formatted = useMemo(() => JSON.stringify(data, null, 2), [data]);
  const lines = useMemo(() => formatJsonLines(formatted), [formatted]);

  return (
    <div className="json-viewer">
      <pre className="json-pre">
        <code>
          {lines.map((line, i) => (
            <JsonLine key={i} line={line} lineNumber={i + 1} maxInitialDepth={maxInitialDepth} />
          ))}
        </code>
      </pre>
    </div>
  );
}

interface LineInfo {
  text: string;
  indent: number;
  isCollapsible: boolean;
  type: 'bracket-open' | 'bracket-close' | 'value' | 'key-value';
}

function formatJsonLines(json: string): LineInfo[] {
  const rawLines = json.split('\n');
  return rawLines.map((text) => {
    const indent = text.search(/\S/);
    const trimmed = text.trim();
    const isCollapsible = trimmed.endsWith('{') || trimmed.endsWith('[');
    let type: LineInfo['type'] = 'value';
    if (isCollapsible) type = 'bracket-open';
    else if (trimmed === '}' || trimmed === '},' || trimmed === ']' || trimmed === '],') type = 'bracket-close';
    else if (trimmed.includes(':')) type = 'key-value';

    return { text, indent: indent === -1 ? 0 : indent, isCollapsible, type };
  });
}

function JsonLine({
  line,
  lineNumber,
  maxInitialDepth,
}: {
  line: LineInfo;
  lineNumber: number;
  maxInitialDepth: number;
}) {
  const [collapsed, setCollapsed] = useState(line.indent / 2 >= maxInitialDepth);

  const highlighted = useMemo(() => highlightJson(line.text), [line.text]);

  if (collapsed && line.isCollapsible) {
    return (
      <div className="json-line">
        <span className="json-line-number">{lineNumber}</span>
        <span className="json-collapse-toggle" onClick={() => setCollapsed(false)} title="Expand">
          ▶
        </span>
        <span dangerouslySetInnerHTML={{ __html: highlighted }} />
        <span className="json-collapsed-indicator"> ... </span>
      </div>
    );
  }

  return (
    <div className="json-line">
      <span className="json-line-number">{lineNumber}</span>
      {line.isCollapsible ? (
        <span className="json-collapse-toggle" onClick={() => setCollapsed(true)} title="Collapse">
          ▼
        </span>
      ) : (
        <span className="json-collapse-spacer" />
      )}
      <span dangerouslySetInnerHTML={{ __html: highlighted }} />
    </div>
  );
}

function highlightJson(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"([^"]+)"(\s*:)/g, '<span class="json-key">"$1"</span>$2')
    .replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
}
