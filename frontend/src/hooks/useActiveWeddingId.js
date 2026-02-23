import { useEffect, useMemo, useState } from "react";
import { useApi } from "./useApi";

const DEFAULT_WEDDING_ID = Number(import.meta.env.VITE_DEFAULT_WEDDING_ID || 1);

export function useActiveWeddingId(explicitWeddingId) {
  const { getPrimaryWeddingId } = useApi();
  const [weddingId, setWeddingId] = useState(
    Number.isInteger(Number(explicitWeddingId)) && Number(explicitWeddingId) > 0
      ? Number(explicitWeddingId)
      : DEFAULT_WEDDING_ID,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const parsedExplicit = Number(explicitWeddingId);
    if (Number.isInteger(parsedExplicit) && parsedExplicit > 0) {
      setWeddingId(parsedExplicit);
      setError("");
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError("");

    getPrimaryWeddingId()
      .then((resolvedId) => {
        if (!active) return;
        setWeddingId(resolvedId);
      })
      .catch((resolveError) => {
        if (!active) return;
        setError(resolveError.message || "Unable to resolve wedding id.");
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [explicitWeddingId, getPrimaryWeddingId]);

  return useMemo(
    () => ({
      weddingId,
      isLoading,
      error,
    }),
    [error, isLoading, weddingId],
  );
}
