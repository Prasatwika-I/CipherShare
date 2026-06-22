import { useNavigate } from 'react-router-dom';

export default function BackButton({ to, label = 'Back' }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      // Go back in history, or fall back to home
      if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <button onClick={handleBack} className="back-btn">
      <svg
        width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      {label}
    </button>
  );
}
