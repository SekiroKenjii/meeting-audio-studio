import { useEffect, useRef, DependencyList } from "react";

/**
 * Custom hook that prevents duplicate calls in React StrictMode
 * Use this instead of useEffect when you want to prevent double execution in development
 *
 * @param effect - The effect function to run (same as useEffect)
 * @param deps - Dependency array (same as useEffect)
 * @param key - Optional unique key to track this specific effect (useful when using multiple times in same component)
 */
export const useStrictModeEffect = (
  effect: () => void | (() => void),
  deps?: DependencyList,
  key?: string
) => {
  const hasRunRef = useRef<Set<string>>(new Set());
  const lastDepsRef = useRef<DependencyList | undefined>(undefined);
  const effectKey = key || "default";

  useEffect(() => {
    // Create a unique key for this effect instance
    const instanceKey = `${effectKey}-${JSON.stringify(deps)}`;

    // Check if this is a refresh scenario by comparing specific dependency patterns
    const isRefreshScenario =
      lastDepsRef.current &&
      deps &&
      lastDepsRef.current.length === deps.length &&
      lastDepsRef.current.some((prevDep, index) => {
        const currentDep = deps[index];
        // Detect if a numeric dependency (likely refreshTrigger) has incremented
        return (
          typeof prevDep === "number" &&
          typeof currentDep === "number" &&
          currentDep > prevDep
        );
      });

    // If this is a refresh scenario, clear the tracking for this effect
    if (isRefreshScenario) {
      // Clear only keys that match this effectKey to avoid affecting other effects
      const keysToDelete = Array.from(hasRunRef.current).filter((key) =>
        key.startsWith(`${effectKey}-`)
      );
      keysToDelete.forEach((key) => hasRunRef.current.delete(key));
    }

    // Store current deps for next comparison
    lastDepsRef.current = deps;

    // Check if this effect has already run for this dependency combination
    if (hasRunRef.current.has(instanceKey)) {
      return;
    }

    // Mark this effect as having run
    hasRunRef.current.add(instanceKey);

    // Run the effect
    const cleanup = effect();

    // Return cleanup function if provided
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

/**
 * Simpler version for effects that don't need dependency tracking
 * Use this for mount-only effects (empty dependency array)
 */
export const useStrictModeMountEffect = (effect: () => void | (() => void)) => {
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;

    hasRunRef.current = true;
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

/**
 * Hook specifically for API calls that prevents duplicate requests
 * Includes loading state management
 */
export const useStrictModeAsyncEffect = <T>(
  asyncEffect: () => Promise<T>,
  deps?: DependencyList,
  key?: string
) => {
  const hasRunRef = useRef<Set<string>>(new Set());
  const lastDepsRef = useRef<DependencyList | undefined>(undefined);
  const effectKey = key || "default";

  useEffect(() => {
    const instanceKey = `${effectKey}-${JSON.stringify(deps)}`;

    // Check if this is a refresh scenario by comparing specific dependency patterns
    const isRefreshScenario =
      lastDepsRef.current &&
      deps &&
      lastDepsRef.current.length === deps.length &&
      lastDepsRef.current.some((prevDep, index) => {
        const currentDep = deps[index];
        // Detect if a numeric dependency (likely refreshTrigger) has incremented
        return (
          typeof prevDep === "number" &&
          typeof currentDep === "number" &&
          currentDep > prevDep
        );
      });

    // If this is a refresh scenario, clear the tracking for this effect
    if (isRefreshScenario) {
      // Clear only keys that match this effectKey to avoid affecting other effects
      const keysToDelete = Array.from(hasRunRef.current).filter((key) =>
        key.startsWith(`${effectKey}-`)
      );
      keysToDelete.forEach((key) => hasRunRef.current.delete(key));
    }

    // Store current deps for next comparison
    lastDepsRef.current = deps;

    // Check if this effect has already run for this dependency combination
    if (hasRunRef.current.has(instanceKey)) {
      return;
    }

    // Mark this effect as having run
    hasRunRef.current.add(instanceKey);

    // Execute async effect
    asyncEffect().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
