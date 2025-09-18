"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

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
    <Card className="card-modern">
      <CardContent className="mobile-card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-secondary">Filter Products</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={localFilters.searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Group Select */}
          <Select value={localFilters.selectedGroup} onValueChange={handleGroupChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select group" />
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
            <SelectTrigger>
              <SelectValue placeholder={localFilters.selectedGroup !== "all" ? "All Sub-Groups" : "Select a Group first"} />
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

        {/* Active filters summary */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {localFilters.searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                  Search: "{localFilters.searchTerm}"
                  <button onClick={() => handleSearchChange("")} className="hover:bg-primary/20 rounded">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {localFilters.selectedGroup !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/10 text-secondary rounded-md text-sm">
                  Group: {localFilters.selectedGroup}
                  <button onClick={() => handleGroupChange("all")} className="hover:bg-secondary/20 rounded">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {localFilters.selectedSubGroup !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent-foreground rounded-md text-sm">
                  Sub-Group: {localFilters.selectedSubGroup}
                  <button onClick={() => handleSubGroupChange("all")} className="hover:bg-accent/20 rounded">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}