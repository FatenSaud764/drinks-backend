export default function SharedButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
    >
      {children}
    </button>
  );
}

