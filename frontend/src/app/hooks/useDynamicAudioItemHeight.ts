import { useCallback, useEffect, useRef, useState } from "react";

interface UseDynamicAudioItemHeightOptions {
  minItems?: number;
  maxItems?: number;
  extraHeight?: number; // Additional height to account for (e.g., buttons, padding)
  itemSelector?: string; // CSS selector for items to measure
  highWaterMark?: boolean; // Only increase visible items, never decrease
}

interface UseDynamicAudioItemHeightResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  visibleItems: number;
  itemHeight: number;
  isCalculating: boolean;
  minContainerHeight: number; // For high-water mark behavior
}

/**
 * Custom hook for dynamically calculating how many items can fit in a container
 * Addresses the issues with magic numbers and setTimeout by:
 * 1. Dynamically measuring actual item height
 * 2. Using ResizeObserver for reliable container size changes
 * 3. Using requestAnimationFrame for proper timing
 */
export const useDynamicAudioItemHeight = (
  totalItems: number,
  options: UseDynamicAudioItemHeightOptions = {}
): UseDynamicAudioItemHeightResult => {
  const {
    minItems = 3,
    maxItems = 10,
    extraHeight = 40,
    itemSelector = "[data-item]",
    highWaterMark = false,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState(minItems);
  const [maxVisibleItems, setMaxVisibleItems] = useState(minItems); // Track the maximum items ever shown
  const [itemHeight, setItemHeight] = useState(0);
  const [isCalculating, setIsCalculating] = useState(true);
  const [minContainerHeight, setMinContainerHeight] = useState(0);

  const calculateVisibleItems = useCallback(() => {
    if (!containerRef.current) return;

    setIsCalculating(true);

    // Use requestAnimationFrame to ensure DOM is ready
    const animationFrame = requestAnimationFrame(() => {
      if (!containerRef.current) return;

      // Try to measure actual item height
      const firstItem = containerRef.current.querySelector(
        itemSelector
      ) as HTMLElement;

      let measuredItemHeight = itemHeight;
      if (firstItem) {
        // Get the actual height including margins
        const computedStyle = window.getComputedStyle(firstItem);
        const marginTop = parseFloat(computedStyle.marginTop) || 0;
        const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
        measuredItemHeight = firstItem.offsetHeight + marginTop + marginBottom;

        if (measuredItemHeight !== itemHeight) {
          setItemHeight(measuredItemHeight);
        }
      }

      // Calculate visible items based on container height
      if (measuredItemHeight > 0) {
        const containerHeight = containerRef.current.clientHeight;
        const availableHeight = Math.max(0, containerHeight - extraHeight);

        const calculatedItems = Math.floor(
          availableHeight / measuredItemHeight
        );
        const clampedItems = Math.max(
          minItems,
          Math.min(maxItems, calculatedItems, totalItems)
        );

        // Apply high-water mark behavior if enabled
        const finalVisibleItems = highWaterMark
          ? Math.max(clampedItems, maxVisibleItems)
          : clampedItems;

        setVisibleItems(finalVisibleItems);

        if (highWaterMark) {
          setMaxVisibleItems(finalVisibleItems);
          // Calculate and maintain minimum container height based on max items
          const minHeight =
            finalVisibleItems * measuredItemHeight + extraHeight;
          setMinContainerHeight(minHeight);
        }
      }

      setIsCalculating(false);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [
    itemHeight,
    totalItems,
    minItems,
    maxItems,
    extraHeight,
    itemSelector,
    highWaterMark,
    maxVisibleItems,
  ]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initial calculation
    calculateVisibleItems();

    // Set up ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleItems();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [calculateVisibleItems]);

  // Recalculate when total items change
  useEffect(() => {
    calculateVisibleItems();
  }, [totalItems, calculateVisibleItems]);

  return {
    containerRef,
    visibleItems,
    itemHeight,
    isCalculating,
    minContainerHeight,
  };
};

/**
 * Simplified version for components that don't need dynamic height calculation
 * but want to avoid magic numbers
 */
export const useStaticItemDisplay = (
  totalItems: number,
  defaultVisible: number = 3
) => {
  const visibleItems = Math.min(defaultVisible, totalItems);

  return {
    visibleItems,
    hasMore: totalItems > defaultVisible,
  };
};
