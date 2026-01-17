function Toast({ toast }) {
  if (!toast) return null;

  const bgColor = toast.type === 'success' 
    ? 'bg-green-500' 
    : toast.type === 'error'
    ? 'bg-red-500'
    : 'bg-blue-500';

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[200px]`}>
        <span className="font-medium">{toast.message}</span>
      </div>
    </div>
  );
}

export default Toast;
