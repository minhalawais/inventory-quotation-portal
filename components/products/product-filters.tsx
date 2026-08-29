"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"

interface SubGroup {
  group: string
  name: string
}

interface ProductFiltersProps {
  onFilterChange: (filters: {
    searchTerm: string
    selectedGroup: string
    selectedSubGroup: string
  }) => void
  groups: string[]
  subGroups: SubGroup[]
  currentFilters: {
    searchTerm: string
    selectedGroup: string
    selectedSubGroup: string
  }
}

export default function ProductFilters({ onFilterChange, groups, subGroups, currentFilters }: ProductFiltersProps) {
  const [localFilters, setLocalFilters] = useState(currentFilters)

  // Get sub-groups for the selected group
  const availableSubGroups = localFilters.selectedGroup === "all" 
    ? [...new Set(subGroups.map(sg => sg.name))]
    : [...new Set(subGroups.filter(sg => sg.group === localFilters.selectedGroup).map(sg => sg.name))]

  useEffect(() => {
    onFilterChange(localFilters)
  }, [localFilters, onFilterChange])

  const handleSearchChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, searchTerm: value }))
  }

  const handleGroupChange = (value: string) => {
    setLocalFilters(prev => ({ 
      ...prev, 
      selectedGroup: value,
      selectedSubGroup: "all" // Reset sub-group when group changes
    }))
  }

  const handleSubGroupChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, selectedSubGroup: value }))
  }

  const clearFilters = () => {
    setLocalFilters({
      searchTerm: "",
      selectedGroup: "all",
      selectedSubGroup: "all"
    })
  }

  const hasActiveFilters = localFilters.searchTerm || 
    localFilters.selectedGroup !== "all" || 
    localFilters.selectedSubGroup !== "all"

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200"
      style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Filter className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Filter catalog</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 px-2.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Reset all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or ID..."
            value={localFilters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-9 pl-9 rounded-lg text-sm border-gray-200 focus:border-indigo-500"
          />
        </div>

        {/* Group Select */}
        <Select value={localFilters.selectedGroup} onValueChange={handleGroupChange}>
          <SelectTrigger className="h-9 rounded-lg text-sm border-gray-200">
            <SelectValue placeholder="All Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sub-Group Select */}
        <Select
          value={localFilters.selectedSubGroup}
          onValueChange={handleSubGroupChange}
          disabled={localFilters.selectedGroup === "all" && availableSubGroups.length === 0}
        >
          <SelectTrigger className="h-9 rounded-lg text-sm border-gray-200">
            <SelectValue placeholder={localFilters.selectedGroup !== "all" ? "All Sub-Groups" : "Select group first"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sub-Groups</SelectItem>
            {availableSubGroups.map((subGroup) => (
              <SelectItem key={subGroup} value={subGroup}>
                {subGroup}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active filters pill tags */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-gray-400">Active filters:</span>
          {localFilters.searchTerm && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-medium">
              "{localFilters.searchTerm}"
              <button onClick={() => handleSearchChange("")} className="hover:text-indigo-900 ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {localFilters.selectedGroup !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-medium">
              Group: {localFilters.selectedGroup}
              <button onClick={() => handleGroupChange("all")} className="hover:text-gray-900 ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {localFilters.selectedSubGroup !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full text-xs font-medium">
              Sub: {localFilters.selectedSubGroup}
              <button onClick={() => handleSubGroupChange("all")} className="hover:text-violet-900 ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
