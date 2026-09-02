"use client"

import Link from "next/link"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { ProductClassification, TaxonomyTree } from "@/lib/product-classification"

export type ClassificationFormValue = ProductClassification

interface ClassificationFieldsProps {
  value: ClassificationFormValue
  onChange: (value: ClassificationFormValue) => void
  tree: TaxonomyTree
  loading?: boolean
  showManageLink?: boolean
}

export function ClassificationFields({
  value,
  onChange,
  tree,
  loading,
  showManageLink = true,
}: ClassificationFieldsProps) {
  const departments = tree.departments
  const selectedDepartment =
    departments.find((item) => item._id === value.departmentId) ||
    departments.find((item) => item.name === value.department)
  const categories = selectedDepartment?.categories ?? []
  const selectedCategory =
    categories.find((item) => item._id === value.categoryId) ||
    categories.find((item) => item.name === value.category)
  const subcategories = selectedCategory?.subcategories ?? []

  const unmatchedDepartment =
    value.department && !departments.some((item) => item._id === value.departmentId || item.name === value.department)
      ? value.department
      : null
  const unmatchedCategory =
    value.category && !categories.some((item) => item._id === value.categoryId || item.name === value.category)
      ? value.category
      : null
  const selectedSubcategory =
    subcategories.find((item) => item._id === value.subCategoryId) ||
    subcategories.find((item) => item.name === value.subCategory)
  const unmatchedSubCategory =
    value.subCategory &&
    !subcategories.some((item) => item._id === value.subCategoryId || item.name === value.subCategory)
      ? value.subCategory
      : null

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select
            value={selectedDepartment?._id || (unmatchedDepartment ? `legacy-dept:${unmatchedDepartment}` : undefined)}
            onValueChange={(nextId) => {
              if (nextId.startsWith("legacy-dept:")) return
              const next = departments.find((item) => item._id === nextId)
              onChange({
                departmentId: next?._id || "",
                department: next?.name || "",
                categoryId: "",
                category: "",
                subCategoryId: "",
                subCategory: "",
              })
            }}
          >
            <SelectTrigger id="department" className="h-10">
              <SelectValue placeholder={departments.length ? "Select department" : "No departments yet"} />
            </SelectTrigger>
            <SelectContent>
              {unmatchedDepartment && (
                <SelectItem value={`legacy-dept:${unmatchedDepartment}`}>{unmatchedDepartment}</SelectItem>
              )}
              {departments.map((department) => (
                <SelectItem key={department._id} value={department._id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={selectedCategory?._id || (unmatchedCategory ? `legacy-cat:${unmatchedCategory}` : undefined)}
            onValueChange={(nextId) => {
              if (nextId.startsWith("legacy-cat:")) return
              const next = categories.find((item) => item._id === nextId)
              onChange({
                ...value,
                departmentId: selectedDepartment?._id || value.departmentId,
                department: selectedDepartment?.name || value.department,
                categoryId: next?._id || "",
                category: next?.name || "",
                subCategoryId: "",
                subCategory: "",
              })
            }}
            disabled={!selectedDepartment && !unmatchedDepartment}
          >
            <SelectTrigger id="category" className="h-10">
              <SelectValue
                placeholder={
                  selectedDepartment || unmatchedDepartment ? "Select category" : "Select department first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {unmatchedCategory && (
                <SelectItem value={`legacy-cat:${unmatchedCategory}`}>{unmatchedCategory}</SelectItem>
              )}
              {categories.map((category) => (
                <SelectItem key={category._id} value={category._id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subCategory">Subcategory</Label>
          <Select
            value={selectedSubcategory?._id || (unmatchedSubCategory ? `legacy-sub:${unmatchedSubCategory}` : undefined)}
            onValueChange={(nextId) => {
              if (nextId.startsWith("legacy-sub:")) return
              const next = subcategories.find((item) => item._id === nextId)
              onChange({
                ...value,
                departmentId: selectedDepartment?._id || value.departmentId,
                department: selectedDepartment?.name || value.department,
                categoryId: selectedCategory?._id || value.categoryId,
                category: selectedCategory?.name || value.category,
                subCategoryId: next?._id || "",
                subCategory: next?.name || "",
              })
            }}
            disabled={(!selectedCategory && !unmatchedCategory) || (subcategories.length === 0 && !unmatchedSubCategory)}
          >
            <SelectTrigger id="subCategory" className="h-10">
              <SelectValue
                placeholder={
                  !selectedCategory && !unmatchedCategory
                    ? "Select category first"
                    : subcategories.length
                      ? "Select subcategory"
                      : "No subcategories"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {unmatchedSubCategory && (
                <SelectItem value={`legacy-sub:${unmatchedSubCategory}`}>{unmatchedSubCategory}</SelectItem>
              )}
              {subcategories.map((sub) => (
                <SelectItem key={sub._id} value={sub._id}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showManageLink && (
        <p className="text-xs text-muted-foreground">
          Need a new option?{" "}
          <Link href="/products/classifications" className="font-medium text-foreground underline-offset-2 hover:underline">
            Manage classifications
          </Link>
        </p>
      )}
    </div>
  )
}
