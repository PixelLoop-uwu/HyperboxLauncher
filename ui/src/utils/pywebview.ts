export const getPywebviewApi = async () => {
  const isReady = () => typeof (window as any).pywebview?.api?.login_perform === 'function';

  if (isReady()) {
    return (window as any).pywebview.api;
  }

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (isReady()) {
        clearInterval(interval);
        clearTimeout(timeout);
        resolve((window as any).pywebview.api);
      }
    }, 20);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      reject(new Error('API pywebview не инициализировано'));
    }, 5000);
  });
};