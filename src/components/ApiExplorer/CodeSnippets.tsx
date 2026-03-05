import { useState } from 'react';
import { CopyButton } from '../common/CopyButton';
import { snippetGenerators, snippetLabels, type SnippetLanguage } from '../../utils/codeGenerators';
import type { ApiRequestInfo } from '../../types/azure';
import './CodeSnippets.css';

interface CodeSnippetsProps {
  request: ApiRequestInfo;
}

const languages: SnippetLanguage[] = ['curl', 'python', 'powershell', 'csharp', 'javascript'];

export function CodeSnippets({ request }: CodeSnippetsProps) {
  const [activeLang, setActiveLang] = useState<SnippetLanguage>('curl');

  const code = snippetGenerators[activeLang](request);

  return (
    <div className="code-snippets">
      <div className="snippets-header">
        <h3 className="panel-title">
          <span className="panel-icon">💻</span> Code Snippets
        </h3>
        <CopyButton text={code} label="Copy Code" />
      </div>

      <div className="snippets-tabs">
        {languages.map((lang) => (
          <button
            key={lang}
            className={`snippet-tab ${activeLang === lang ? 'active' : ''}`}
            onClick={() => setActiveLang(lang)}
          >
            {snippetLabels[lang]}
          </button>
        ))}
      </div>

      <div className="snippet-code-container">
        <pre className="snippet-code">{code}</pre>
      </div>
    </div>
  );
}
