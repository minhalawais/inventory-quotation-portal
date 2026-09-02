"use client"

import { useCallback, useEffect, useState } from "react"

import type { TaxonomyTree } from "@/lib/product-classification"

const EMPTY_TREE: TaxonomyTree = { departments: [] }

export function useTaxonomy() {
  const [tree, setTree] = useState<TaxonomyTree>(EMPTY_TREE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const refetch = useCallback(async () => {
    try {
      setError(false)
      const response = await fetch("/api/taxonomy")
      if (!response.ok) {
        setError(true)
        return
      }
      const data = (await response.json()) as TaxonomyTree
      setTree({ departments: data.departments || [] })
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { tree, loading, error, refetch }
}
