import type { TaxonomyTree } from "@/lib/product-classification"

export interface ClassificationOption {
  id: string
  label: string
  departmentId: string
  categoryId?: string
}

export interface ClassificationSelection {
  departmentIds: string[]
  categoryIds: string[]
  subCategoryIds: string[]
}

function departmentScope(tree: TaxonomyTree, departmentIds: string[]) {
  if (departmentIds.length === 0) return tree.departments
  const allowed = new Set(departmentIds)
  return tree.departments.filter((department) => allowed.has(department._id))
}

export function categoryOptionsForSelection(tree: TaxonomyTree, departmentIds: string[]) {
  const scopedDepartments = departmentScope(tree, departmentIds)
  const showDepartmentPrefix = departmentIds.length === 0

  return scopedDepartments.flatMap((department) =>
    department.categories.map((category) => ({
      id: category._id,
      label: showDepartmentPrefix ? `${department.name} · ${category.name}` : category.name,
      departmentId: department._id,
      categoryId: category._id,
    })),
  )
}

export function subCategoryOptionsForSelection(
  tree: TaxonomyTree,
  departmentIds: string[],
  categoryIds: string[],
) {
  const scopedDepartments = departmentScope(tree, departmentIds)
  const categoryFilter = new Set(categoryIds)
  const showFullPath = categoryIds.length === 0

  const categories = scopedDepartments.flatMap((department) =>
    department.categories
      .filter((category) => categoryFilter.size === 0 || categoryFilter.has(category._id))
      .map((category) => ({ department, category })),
  )

  return categories.flatMap(({ department, category }) =>
    category.subcategories.map((subcategory) => ({
      id: subcategory._id,
      label: showFullPath
        ? `${department.name} · ${category.name} · ${subcategory.name}`
        : subcategory.name,
      departmentId: department._id,
      categoryId: category._id,
    })),
  )
}

export function pruneClassificationSelection(
  tree: TaxonomyTree,
  selection: ClassificationSelection,
): ClassificationSelection {
  const departmentIds = [...selection.departmentIds]
  const validCategoryIds = new Set(categoryOptionsForSelection(tree, departmentIds).map((option) => option.id))
  const categoryIds = selection.categoryIds.filter((id) => validCategoryIds.has(id))
  const validSubCategoryIds = new Set(
    subCategoryOptionsForSelection(tree, departmentIds, categoryIds).map((option) => option.id),
  )
  const subCategoryIds = selection.subCategoryIds.filter((id) => validSubCategoryIds.has(id))

  return { departmentIds, categoryIds, subCategoryIds }
}
