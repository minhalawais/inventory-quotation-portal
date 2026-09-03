import {
  classifyProduct,
  formatClassification,
  type ClassifiableProduct,
  type TaxonomyDepartment,
  type TaxonomyTree,
  type TaxonomyType,
} from "@/lib/product-classification"

/** Show a find field once a quote is long enough to scan. */
export const QUOTE_FIND_THRESHOLD = 16
/** Tighter rows and static thumbs past this size. */
export const QUOTE_COMPACT_THRESHOLD = 24
/** Skip product photos in PDFs so 100-line quotes stay printable. */
export const QUOTE_PDF_PHOTO_LIMIT = 36

export interface CatalogPickNode {
  id: string
  type: TaxonomyType
  name: string
  parentId: string | null
  departmentId: string
  categoryId?: string
  pathLabel: string
}

export interface QuotationLineClassification {
  department?: string
  category?: string
  subCategory?: string
}

export interface GroupedQuoteItems<T> {
  key: string
  label: string
  items: T[]
  indexes: number[]
}

function norm(value: string | undefined) {
  return (value || "").trim().toLowerCase()
}

export function asId(value: unknown): string {
  if (value == null || value === "") return ""
  if (typeof value === "string") return value
  if (typeof value === "object") {
    const record = value as { $oid?: string; toHexString?: () => string }
    if (typeof record.$oid === "string") return record.$oid
    if (typeof record.toHexString === "function") return record.toHexString()
  }
  const text = String(value)
  return text === "[object Object]" ? "" : text
}

function namesEqual(left: string | undefined, right: string | undefined) {
  const a = norm(left)
  const b = norm(right)
  return Boolean(a) && a === b
}

export function walkTaxonomy(tree: TaxonomyTree): CatalogPickNode[] {
  const nodes: CatalogPickNode[] = []
  for (const department of tree.departments) {
    nodes.push({
      id: department._id,
      type: "department",
      name: department.name,
      parentId: null,
      departmentId: department._id,
      pathLabel: department.name,
    })
    for (const category of department.categories) {
      const categoryPath = `${department.name} · ${category.name}`
      nodes.push({
        id: category._id,
        type: "category",
        name: category.name,
        parentId: department._id,
        departmentId: department._id,
        categoryId: category._id,
        pathLabel: categoryPath,
      })
      for (const subcategory of category.subcategories) {
        nodes.push({
          id: subcategory._id,
          type: "subcategory",
          name: subcategory.name,
          parentId: category._id,
          departmentId: department._id,
          categoryId: category._id,
          pathLabel: `${categoryPath} · ${subcategory.name}`,
        })
      }
    }
  }
  return nodes
}

export function classificationFromProduct(product: ClassifiableProduct | null | undefined): QuotationLineClassification {
  if (!product) return { department: "", category: "", subCategory: "" }
  const classified = classifyProduct(product)
  return {
    department: classified.department,
    category: classified.category,
    subCategory: classified.subCategory,
  }
}

export function productMatchesNode(
  product: ClassifiableProduct,
  node: CatalogPickNode,
  tree: TaxonomyTree,
): boolean {
  const classified = classifyProduct(product)
  const departmentName = classified.department || product.group || ""
  const categoryName = classified.category || product.subGroup || ""
  const subName = classified.subCategory || ""

  if (node.type === "department") {
    return asId(classified.departmentId) === node.id || namesEqual(departmentName, node.name)
  }

  const department = tree.departments.find((item) => item._id === node.departmentId)

  if (node.type === "category") {
    if (asId(classified.categoryId) === node.id) return true
    if (!namesEqual(categoryName, node.name)) return false
    return asId(classified.departmentId) === node.departmentId || namesEqual(departmentName, department?.name)
  }

  if (asId(classified.subCategoryId) === node.id) return true
  if (!namesEqual(subName, node.name)) return false
  const category = department?.categories.find((item) => item._id === node.categoryId)
  return asId(classified.categoryId) === node.categoryId || namesEqual(categoryName, category?.name)
}

export function productsMatchingNodes<T extends ClassifiableProduct & { _id: string }>(
  products: T[],
  selectedIds: Iterable<string>,
  tree: TaxonomyTree,
): T[] {
  const selected = new Set(Array.from(selectedIds, asId).filter(Boolean))
  if (selected.size === 0) return []
  const nodes = walkTaxonomy(tree).filter((node) => selected.has(asId(node.id)))
  if (nodes.length === 0) return []
  const seen = new Set<string>()
  const matched: T[] = []
  for (const product of products) {
    const id = asId(product._id)
    if (!id || seen.has(id)) continue
    if (nodes.some((node) => productMatchesNode(product, node, tree))) {
      seen.add(id)
      matched.push(product)
    }
  }
  return matched
}

export function countProductsForNode<T extends ClassifiableProduct>(
  products: T[],
  node: CatalogPickNode,
  tree: TaxonomyTree,
) {
  return products.filter((product) => productMatchesNode(product, node, tree)).length
}

export function groupQuoteItems<T extends QuotationLineClassification>(
  items: T[],
  sourceIndexes?: number[],
): GroupedQuoteItems<T>[] {
  const groups = new Map<string, GroupedQuoteItems<T>>()
  items.forEach((item, index) => {
    const classified = classifyProduct(item)
    const key = `${classified.department}\0${classified.category}\0${classified.subCategory}`
    const label = formatClassification(classified) || "Unclassified"
    const sourceIndex = sourceIndexes?.[index] ?? index
    const existing = groups.get(key)
    if (existing) {
      existing.items.push(item)
      existing.indexes.push(sourceIndex)
      return
    }
    groups.set(key, { key, label, items: [item], indexes: [sourceIndex] })
  })
  return Array.from(groups.values()).sort((a, b) => {
    if (a.label === "Unclassified") return 1
    if (b.label === "Unclassified") return -1
    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  })
}

export function quotationItemMatchesQuery(
  item: QuotationLineClassification & { productName?: string; productId?: string },
  query: string,
) {
  const term = query.trim().toLowerCase()
  if (!term) return true
  return [item.productName, item.productId, item.department, item.category, item.subCategory]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(term))
}

export interface QuoteLineDraft {
  key: string
  productId: string
  source: "catalog" | "manual"
}

/** Merge classification-loaded products with manually added lines. Does not touch a database. */
export function mergeCatalogLineItems<TProduct extends { _id: string }, TLine extends QuoteLineDraft>(
  current: TLine[],
  matchedProducts: TProduct[],
  skipped: Iterable<string>,
  toCatalogLine: (product: TProduct) => TLine,
): TLine[] {
  const matchedIds = new Set(matchedProducts.map((product) => asId(product._id)).filter(Boolean))
  const skippedSet = new Set(Array.from(skipped, asId).filter(Boolean))
  const manual = current.filter((item) => item.source !== "catalog")
  const manualIds = new Set(manual.map((item) => asId(item.productId)).filter(Boolean))
  const keptCatalog = current.filter(
    (item) => item.source === "catalog" && matchedIds.has(asId(item.productId)) && !skippedSet.has(asId(item.productId)),
  )
  const keptIds = new Set(keptCatalog.map((item) => asId(item.productId)))
  const incoming = matchedProducts
    .filter((product) => {
      const id = asId(product._id)
      return id && !keptIds.has(id) && !manualIds.has(id) && !skippedSet.has(id)
    })
    .map((product) => toCatalogLine(product))
  return [...keptCatalog, ...incoming, ...manual]
}

export function visibleTaxonomyDepartments(tree: TaxonomyTree, query: string): TaxonomyDepartment[] {
  const term = query.trim().toLowerCase()
  if (!term) return tree.departments
  return tree.departments
    .map((department) => {
      const departmentMatch = department.name.toLowerCase().includes(term)
      const categories = department.categories
        .map((category) => {
          const categoryMatch = category.name.toLowerCase().includes(term)
          const subcategories = category.subcategories.filter(
            (item) => departmentMatch || categoryMatch || item.name.toLowerCase().includes(term),
          )
          if (departmentMatch || categoryMatch || subcategories.length > 0) {
            return { ...category, subcategories: departmentMatch || categoryMatch ? category.subcategories : subcategories }
          }
          return null
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
      if (departmentMatch || categories.length > 0) {
        return { ...department, categories: departmentMatch ? department.categories : categories }
      }
      return null
    })
    .filter((item): item is TaxonomyDepartment => Boolean(item))
}
