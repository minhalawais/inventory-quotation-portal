"use client"

import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Toolbar, ToolbarGroup } from "@/components/shared/toolbar"

export interface ProductFilterState {
  searchTerm: string
  selectedDepartment: string
  selectedCategory: string
  selectedSubCategory: string
}

interface CategoryOption {
  department: string
  name: string
}

interface SubCategoryOption {
  department: string
  category: string
  name: string
}

interface ProductFiltersProps {
  onFilterChange: (filters: ProductFilterState) => void
  departments: string[]
  categories: CategoryOption[]
  subCategories: SubCategoryOption[]
  currentFilters: ProductFilterState
  resultCount?: number
}

export default function ProductFilters({
  onFilterChange,
  departments,
  categories,
  subCategories,
  currentFilters,
  resultCount,
}: ProductFiltersProps) {
  const [localFilters, setLocalFilters] = useState(currentFilters)

  const availableCategories =
    localFilters.selectedDepartment === "all"
      ? [...new Set(categories.map((item) => item.name))]
      : [...new Set(categories.filter((item) => item.department === localFilters.selectedDepartment).map((item) => item.name))]

  const availableSubCategories = subCategories
    .filter((item) => {
      if (localFilters.selectedDepartment !== "all" && item.department !== localFilters.selectedDepartment) return false
      if (localFilters.selectedCategory !== "all" && item.category !== localFilters.selectedCategory) return false
      return Boolean(item.name)
    })
    .map((item) => item.name)
    .filter((name, index, all) => all.indexOf(name) === index)

  useEffect(() => {
    onFilterChange(localFilters)
  }, [localFilters, onFilterChange])

  const handleSearchChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, searchTerm: value }))
  }

  const handleDepartmentChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      selectedDepartment: value,
      selectedCategory: "all",
      selectedSubCategory: "all",
    }))
  }

  const handleCategoryChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      selectedCategory: value,
      selectedSubCategory: "all",
    }))
  }

  const handleSubCategoryChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, selectedSubCategory: value }))
  }

  const clearFilters = () => {
    setLocalFilters({
      searchTerm: "",
      selectedDepartment: "all",
      selectedCategory: "all",
      selectedSubCategory: "all",
    })
  }

  const hasActiveFilters =
    localFilters.searchTerm ||
    localFilters.selectedDepartment !== "all" ||
    localFilters.selectedCategory !== "all" ||
    localFilters.selectedSubCategory !== "all"

  return (
    <div className="space-y-2">
      <Toolbar>
        <ToolbarGroup className="w-full flex-1 sm:max-w-none">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              placeholder="Search by name or ID..."
              value={localFilters.searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-10 pl-9"
              aria-label="Search products"
            />
          </div>
          <Select value={localFilters.selectedDepartment} onValueChange={handleDepartmentChange}>
            <SelectTrigger className="h-10 w-full sm:w-[150px]" aria-label="Filter by department">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department} value={department}>
                  {department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={localFilters.selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-10 w-full sm:w-[150px]" aria-label="Filter by category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {availableCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={localFilters.selectedSubCategory}
            onValueChange={handleSubCategoryChange}
            disabled={availableSubCategories.length === 0}
          >
            <SelectTrigger className="h-10 w-full sm:w-[150px]" aria-label="Filter by subcategory">
              <SelectValue placeholder="All subcategories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subcategories</SelectItem>
              {availableSubCategories.map((subCategory) => (
                <SelectItem key={subCategory} value={subCategory}>
                  {subCategory}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ToolbarGroup>
        <ToolbarGroup>
          {typeof resultCount === "number" && (
            <span className="text-xs text-muted-foreground tabular-nums">{resultCount} results</span>
          )}
          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="h-9">
              <X className="mr-1 h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </ToolbarGroup>
      </Toolbar>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 px-0.5">
          {localFilters.searchTerm && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="inline-flex h-6 items-center gap-1 rounded-full border border-border bg-muted px-2 text-xs text-foreground"
            >
              “{localFilters.searchTerm}”
              <X className="h-3 w-3" aria-hidden />
              <span className="sr-only">Clear search</span>
            </button>
          )}
          {localFilters.selectedDepartment !== "all" && (
            <button
              type="button"
              onClick={() => handleDepartmentChange("all")}
              className="inline-flex h-6 items-center gap-1 rounded-full border border-border bg-muted px-2 text-xs text-foreground"
            >
              {localFilters.selectedDepartment}
              <X className="h-3 w-3" aria-hidden />
              <span className="sr-only">Clear department filter</span>
            </button>
          )}
          {localFilters.selectedCategory !== "all" && (
            <button
              type="button"
              onClick={() => handleCategoryChange("all")}
              className="inline-flex h-6 items-center gap-1 rounded-full border border-border bg-muted px-2 text-xs text-foreground"
            >
              {localFilters.selectedCategory}
              <X className="h-3 w-3" aria-hidden />
              <span className="sr-only">Clear category filter</span>
            </button>
          )}
          {localFilters.selectedSubCategory !== "all" && (
            <button
              type="button"
              onClick={() => handleSubCategoryChange("all")}
              className="inline-flex h-6 items-center gap-1 rounded-full border border-border bg-muted px-2 text-xs text-foreground"
            >
              {localFilters.selectedSubCategory}
              <X className="h-3 w-3" aria-hidden />
              <span className="sr-only">Clear subcategory filter</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
