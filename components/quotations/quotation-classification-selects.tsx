"use client"

import { useMemo, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import type { TaxonomyTree } from "@/lib/product-classification"
import {
  categoryOptionsForSelection,
  subCategoryOptionsForSelection,
} from "@/lib/quotation-classification-options"
import { cn } from "@/lib/utils"

export interface MultiSelectOption {
  id: string
  label: string
}

interface MultiSelectProps {
  id: string
  label: string
  placeholder: string
  hint?: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}

function selectedLabel(options: MultiSelectOption[], value: string[], placeholder: string) {
  if (value.length === 0) return placeholder
  const names = value
    .map((id) => options.find((option) => option.id === id)?.label)
    .filter(Boolean) as string[]
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]}, ${names[1]}`
  return `${names[0]} +${names.length - 1}`
}

function MultiSelect({ id, label, placeholder, hint, options, value, onChange, disabled }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const toggle = (optionId: string) => {
    if (value.includes(optionId)) onChange(value.filter((id) => id !== optionId))
    else onChange([...value, optionId])
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || options.length === 0}
            className="h-10 w-full justify-between font-normal"
          >
            <span className={cn("truncate", value.length === 0 && "text-muted-foreground")}>
              {options.length === 0 ? `No ${label.toLowerCase()}s` : selectedLabel(options, value, placeholder)}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Find ${label.toLowerCase()}`} />
            <CommandList>
              <CommandEmpty>No matches.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = value.includes(option.id)
                  return (
                    <CommandItem
                      key={option.id}
                      value={`${option.label} ${option.id}`}
                      onSelect={() => toggle(option.id)}
                    >
                      <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                      <span className="truncate">{option.label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

interface QuotationClassificationSelectsProps {
  tree: TaxonomyTree
  loading?: boolean
  departmentIds: string[]
  categoryIds: string[]
  subCategoryIds: string[]
  onDepartmentChange: (ids: string[]) => void
  onCategoryChange: (ids: string[]) => void
  onSubCategoryChange: (ids: string[]) => void
}

export function QuotationClassificationSelects({
  tree,
  loading,
  departmentIds,
  categoryIds,
  subCategoryIds,
  onDepartmentChange,
  onCategoryChange,
  onSubCategoryChange,
}: QuotationClassificationSelectsProps) {
  const departmentOptions = useMemo(
    () => tree.departments.map((department) => ({ id: department._id, label: department.name })),
    [tree],
  )
  const categoryOptions = useMemo(
    () => categoryOptionsForSelection(tree, departmentIds),
    [tree, departmentIds],
  )
  const subCategoryOptions = useMemo(
    () => subCategoryOptionsForSelection(tree, departmentIds, categoryIds),
    [tree, departmentIds, categoryIds],
  )

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Pick any level to load products. Each level narrows the list. One selection is enough.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MultiSelect
          id="quote-departments"
          label="Department"
          placeholder="All departments"
          options={departmentOptions}
          value={departmentIds}
          onChange={onDepartmentChange}
        />
        <MultiSelect
          id="quote-categories"
          label="Category"
          placeholder="All categories"
          hint={
            departmentIds.length > 0
              ? "Showing categories in selected department(s)."
              : "Select a department to narrow this list."
          }
          options={categoryOptions}
          value={categoryIds}
          onChange={onCategoryChange}
        />
        <MultiSelect
          id="quote-subcategories"
          label="Subcategory"
          placeholder="All subcategories"
          hint={
            categoryIds.length > 0
              ? "Showing subcategories in selected category(ies)."
              : departmentIds.length > 0
                ? "Select a category to narrow further."
                : "Select a category to narrow this list."
          }
          options={subCategoryOptions}
          value={subCategoryIds}
          onChange={onSubCategoryChange}
          disabled={subCategoryOptions.length === 0}
        />
      </div>
    </div>
  )
}
