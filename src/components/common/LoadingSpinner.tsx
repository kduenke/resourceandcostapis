import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Calling Azure API...' }: LoadingSpinnerProps) {
  return (
    <div className="loading-spinner">
      <div className="spinner-ring">
        <div className="spinner-ring-inner" />
      </div>
      <span className="loading-message">{message}</span>
    </div>
  );
}
