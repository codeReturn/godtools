import { useState, useCallback, useRef, useEffect } from 'react';

export const useHttpClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();

  const controllerRef = useRef(null);
  const isMountedRef = useRef(true);

  const sendRequest = useCallback(
    async (url, method = 'GET', body = null, headers = {}) => {
      setIsLoading(true);

      const httpAbortCtrl =
      controllerRef.current ||
      (controllerRef.current = new AbortController());


      try {
        const response = await fetch(url, {
          method,
          body,
          headers,
          signal: httpAbortCtrl.signal
        });

        const responseData = await response.json();

        if (!isMountedRef.current) return;

        if (!response.ok) {
          throw new Error(responseData.message);
        }

        if (!isMountedRef.current) return;
        setIsLoading(false);
        return responseData;
      } catch (err) {
        if (isMountedRef.current) {
          setError(err.message);
          setIsLoading(false);
        }
        throw err;
      }
    }, []);

  const clearError = () => {
    setError(null);
  };

  const fetchGet = async (url, options) =>{
    setIsLoading(true);
    const response = await fetch(url, options)
    response && setIsLoading(false);
    return await response.json()
  }

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      controllerRef.current && controllerRef.current.abort();
    };
  }, []);

  return { isLoading, error, sendRequest, clearError, fetchGet };
};
