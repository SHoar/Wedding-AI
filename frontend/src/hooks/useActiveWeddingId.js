import { useEffect, useMemo, useState } from "react";
import { useApi } from "./useApi";

const DEFAULT_WEDDING_ID = Number(import.meta.env.VITE_DEFAULT_WEDDING_ID || 1);
const normalizeWeddingId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export function useActiveWeddingId(explicitWeddingId) {
  const { getPrimaryWeddingId } = useApi();
  const explicitId = normalizeWeddingId(explicitWeddingId);
  const hasExplicitWeddingId = explicitId !== null;
  const [resolvedWeddingId, setResolvedWeddingId] = useState(DEFAULT_WEDDING_ID);
  const [isLoading, setIsLoading] = useState(!hasExplicitWeddingId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasExplicitWeddingId) {
      return;
    }

    let active = true;

    getPrimaryWeddingId()
      .then((resolvedId) => {
        if (!active) return;
        setResolvedWeddingId(resolvedId);
        setError("");
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
  }, [getPrimaryWeddingId, hasExplicitWeddingId]);

  return useMemo(
    () => ({
      weddingId: explicitId ?? resolvedWeddingId,
      isLoading: hasExplicitWeddingId ? false : isLoading,
      error: hasExplicitWeddingId ? "" : error,
    }),
    [error, explicitId, hasExplicitWeddingId, isLoading, resolvedWeddingId],
  );
}
