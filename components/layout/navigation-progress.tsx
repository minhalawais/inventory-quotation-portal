"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

function isInternalNavClick(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) return false
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  const anchor = (event.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null
  if (!anchor || anchor.target && anchor.target !== "_self" || anchor.hasAttribute("download")) return false
  const href = anchor.getAttribute("href")
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false
  try {
    const url = new URL(href, window.location.href)
    if (url.origin !== window.location.origin) return false
    return url.pathname !== window.location.pathname || url.search !== window.location.search
  } catch {
    return false
  }
}

function isAppNavigationFetch(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers)
  if (typeof Request !== "undefined" && input instanceof Request) {
    input.headers.forEach((value, key) => {
      if (!headers.has(key)) headers.set(key, value)
    })
  }
  if (headers.get("Next-Router-Prefetch") === "1") return false
  return headers.get("RSC") === "1" || headers.has("Next-Router-State-Tree") || headers.has("Next-Url")
}

function NavigationProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)
  const activeRef = useRef(false)
  const timersRef = useRef<number[]>([])

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }

  const start = () => {
    clearTimers()
    activeRef.current = true
    setVisible(true)
    setWidth(14)
    document.documentElement.classList.add("cursor-progress")
    timersRef.current = [
      window.setTimeout(() => setWidth(42), 120),
      window.setTimeout(() => setWidth(68), 480),
      window.setTimeout(() => setWidth(86), 1400),
    ]
  }

  const finish = () => {
    if (!activeRef.current) return
    clearTimers()
    setWidth(100)
    timersRef.current = [
      window.setTimeout(() => {
        activeRef.current = false
        setVisible(false)
        setWidth(0)
        document.documentElement.classList.remove("cursor-progress")
      }, 160),
    ]
  }

  useEffect(() => {
    finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (isInternalNavClick(event)) start()
    }

    const originalFetch = window.fetch.bind(window)
    window.fetch = (input, init) => {
      try {
        if (isAppNavigationFetch(input, init)) start()
      } catch {
        /* ignore header parse issues */
      }
      return originalFetch(input, init)
    }

    document.addEventListener("click", onClick, true)
    return () => {
      document.removeEventListener("click", onClick, true)
      window.fetch = originalFetch
      clearTimers()
      document.documentElement.classList.remove("cursor-progress")
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
      role="progressbar"
      aria-label="Loading page"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
    >
      <div
        className="h-full bg-[hsl(var(--kk-gold))] transition-[width] duration-200 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBar />
    </Suspense>
  )
}
