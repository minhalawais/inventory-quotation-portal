export type TaxonomyType = "department" | "category" | "subcategory"

export interface TaxonomyNode {
  _id: string
  name: string
  parentId: string | null
}

export interface TaxonomyCategory extends TaxonomyNode {
  subcategories: TaxonomyNode[]
}

export interface TaxonomyDepartment extends TaxonomyNode {
  categories: TaxonomyCategory[]
}

export interface TaxonomyTree {
  departments: TaxonomyDepartment[]
}

export interface ProductClassification {
  department: string
  category: string
  subCategory: string
  departmentId?: string
  categoryId?: string
  subCategoryId?: string
}

export interface ClassifiableProduct {
  department?: string
  category?: string
  subCategory?: string
  departmentId?: string
  categoryId?: string
  subCategoryId?: string
  group?: string
  subGroup?: string
}

export function classifyProduct(product: ClassifiableProduct): ProductClassification {
  const hasNewFields = Boolean(product.department || product.category || product.subCategory)

  if (hasNewFields) {
    return {
      department: (product.department || product.group || "").trim(),
      category: (product.category || "").trim(),
      subCategory: (product.subCategory || "").trim(),
      departmentId: product.departmentId,
      categoryId: product.categoryId,
      subCategoryId: product.subCategoryId,
    }
  }

  return {
    department: (product.group || "").trim(),
    category: (product.subGroup || "").trim(),
    subCategory: "",
    departmentId: product.departmentId,
    categoryId: product.categoryId,
    subCategoryId: product.subCategoryId,
  }
}

export function formatClassification(classification: Pick<ProductClassification, "department" | "category" | "subCategory">) {
  return [classification.department, classification.category, classification.subCategory].filter(Boolean).join(" · ")
}

export function withClassification<T extends object>(product: T): T & ProductClassification {
  const classification = classifyProduct(product as ClassifiableProduct)
  return {
    ...product,
    ...classification,
  }
}
