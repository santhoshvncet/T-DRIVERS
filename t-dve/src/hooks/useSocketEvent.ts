import { useEffect, useState, useCallback } from "react";
import { socket } from "../utils/socket";

export function useSocketRequest<RequestPayload = any, ResponseData = any>(
  requestEvent: string,
  responseEvent: string
) {
  const [data, setData] = useState<ResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendRequest = useCallback((payload: RequestPayload) => {
    if (!socket.connected) {
      console.warn("Socket not connected yet");
    }

    setLoading(true);
    setError(null);

    socket.emit(requestEvent, payload);
  }, []);

  useEffect(() => {
    const handler = (response: any) => {
      setLoading(false);

      if (!response?.success) {
        setError(response?.message || "Socket Error");
        return;
      }

      setData(response);
    };

    socket.on(responseEvent, handler);

    return () => {
      socket.off(responseEvent, handler);
    };
  }, [responseEvent]);

  return { data, error, loading, sendRequest };
}
