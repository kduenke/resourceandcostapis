import './ParameterForm.css';

interface ParameterField {
  name: string;
  label: string;
  description: string;
  required: boolean;
  type: 'text' | 'select' | 'textarea';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  value: string;
}

interface ParameterFormProps {
  fields: ParameterField[];
  onChange: (name: string, value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  submitLabel?: string;
}

export function ParameterForm({ fields, onChange, onSubmit, loading, submitLabel = 'Send Request' }: ParameterFormProps) {
  const canSubmit = fields.filter((f) => f.required).every((f) => f.value.trim());

  return (
    <div className="param-form">
      <div className="param-form-header">
        <h3 className="panel-title">
          <span className="panel-icon">⚡</span> Parameters
        </h3>
      </div>

      <div className="param-fields">
        {fields.map((field) => (
          <div key={field.name} className="param-field">
            <label className="param-label">
              {field.label}
              {field.required && <span className="param-required">*</span>}
            </label>
            <p className="param-description">{field.description}</p>
            {field.type === 'select' ? (
              <select
                value={field.value}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="param-input"
              >
                <option value="">{field.placeholder || 'Select...'}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                value={field.value}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="param-input param-textarea"
                placeholder={field.placeholder}
                rows={8}
              />
            ) : (
              <input
                type="text"
                value={field.value}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="param-input"
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
      </div>

      <div className="param-form-actions">
        <button
          className="param-submit-btn"
          onClick={onSubmit}
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <>
              <span className="btn-spinner" /> Calling API...
            </>
          ) : (
            <>🚀 {submitLabel}</>
          )}
        </button>
      </div>
    </div>
  );
}

export type { ParameterField };
