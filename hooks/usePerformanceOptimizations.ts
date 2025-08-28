/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useMemo, useRef } from "react"

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export const useCache = <T>(key: string, computeFn: () => T, deps: any[]): T => {
  const cache = useRef<Map<string, { value: T; deps: any[] }>>(new Map())

  return useMemo(() => {
    const cached = cache.current.get(key)

    if (cached && JSON.stringify(cached.deps) === JSON.stringify(deps)) {
      return cached.value
    }

    const value = computeFn()
    cache.current.set(key, { value, deps })

    // Limit cache size to prevent memory leaks
    if (cache.current.size > 50) {
        const firstKey = cache.current.keys().next().value
        if (firstKey !== undefined) {
          cache.current.delete(firstKey)
        }
      }

    return value
    }, [computeFn, deps, key]) 
}

export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    )

    observer.observe(element)
    return () => observer.disconnect()
    }, [elementRef, options])

  return isIntersecting
}

export const useVirtualScrolling = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(itemCount - 1, Math.ceil((scrollTop + containerHeight) / itemHeight))
  const offsetY = visibleStart * itemHeight
  const visibleItems = visibleEnd - visibleStart + 1

  return {
    visibleStart,
    visibleEnd,
    offsetY,
    visibleItems,
    setScrollTop,
  }
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0)
  const startTime = useRef(performance.now())

  useEffect(() => {
    renderCount.current += 1
    const endTime = performance.now()
    const renderTime = endTime - startTime.current

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} - Render #${renderCount.current} took ${renderTime.toFixed(2)}ms`)
    }

    startTime.current = performance.now()
  })

  return { renderCount: renderCount.current }
}