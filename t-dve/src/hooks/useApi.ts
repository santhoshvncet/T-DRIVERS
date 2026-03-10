import { useState, useCallback } from "react";

type ApiCallFunction = (...args: any[]) => Promise<any>;
type Callbacks = {
  onCompleted?: (data: any) => void;
  onError?: (error: any) => void;
};

const useApiCall = (apiCall: ApiCallFunction) => {
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (args: any[], { onCompleted, onError }: Callbacks = {}) => {
      setLoading(true);
      try {
        const [url, payload, extraConfig] = args;

        let response;

        // ⭐ IMPORTANT: If payload is FormData, DO NOT set Content-Type
        // Let Axios determine it automatically
        if (payload instanceof FormData) {
          response = await apiCall(url, payload, {
            ...extraConfig,
            headers: {
              ...(extraConfig?.headers || {}),
              // remove Content-Type so Axios can set multipart boundary
            },
          });
        } else {
          // Normal JSON request
          response = await apiCall(url, payload, {
            ...extraConfig,
            headers: {
              "Content-Type": "application/json",
              ...(extraConfig?.headers || {}),
            },
          });
        }

        // Error handling based on status
        if (response.status === 500 || response.status === 401) {
          if (onError) {
            onError(
              response?.data?.message || "An unexpected error occurred"
            );
          }
        }

        // Success
        if ((response.status === 200 || response.status === 201) && onCompleted) {
          onCompleted(response);
        }

        return response;
      } catch (error: any) {
        if (onError) {
          onError(
            error?.response?.data?.error ||
            error?.response?.data?.message ||
              "An unexpected error occurred."
          );

        }
      } finally {
        setLoading(false);
      }
    },
    [apiCall]
  );

  return [execute, { loading }] as const;
};

export default useApiCall;
