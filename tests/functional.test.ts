import assert from "node:assert/strict"
import { test } from "node:test"

import { COMPANY, displayPersonName, quotationRefDisplay, quotationReference, telHref } from "@/lib/company"
import { isIPAllowed, isValidIP } from "@/lib/ip-utils"
import { formatPhoneForWhatsApp } from "@/lib/phone-utils"
import { classifyProduct, formatClassification } from "@/lib/product-classification"
import { collectProductImages } from "@/lib/product-images"
import {
  asId,
  groupQuoteItems,
  mergeCatalogLineItems,
  productsMatchingClassification,
  productsMatchingNodes,
  quotationItemMatchesQuery,
  walkTaxonomy,
} from "@/lib/quotation-catalog"
import { formatQuotationNo, quotationPdfFilename, quotationYear } from "@/lib/quotation-number"
import {
  isQuotationStatus,
  quotationShowsPrices,
  quotationStatusLabel,
  quotationStatusTone,
  resolveStoredProductImages,
} from "@/lib/quotation"
import type { TaxonomyTree } from "@/lib/product-classification"

const tree: TaxonomyTree = {
  departments: [
    {
      _id: "dept-footwear",
      name: "Footwear",
      parentId: null,
      categories: [
        {
          _id: "cat-cricket-shoes",
          name: "Cricket Shoes",
          parentId: "dept-footwear",
          subcategories: [],
        },
      ],
    },
    {
      _id: "dept-cricket",
      name: "Cricket",
      parentId: null,
      categories: [
        {
          _id: "cat-tape",
          name: "Tape Ball",
          parentId: "dept-cricket",
          subcategories: [
            { _id: "sub-tape-bats", name: "Bats", parentId: "cat-tape" },
            { _id: "sub-tape-balls", name: "Balls", parentId: "cat-tape" },
          ],
        },
        {
          _id: "cat-hard",
          name: "Hard Ball",
          parentId: "dept-cricket",
          subcategories: [{ _id: "sub-hard-bats", name: "Bats", parentId: "cat-hard" }],
        },
      ],
    },
    {
      _id: "dept-padel",
      name: "Padel",
      parentId: null,
      categories: [
        {
          _id: "cat-padel-rackets",
          name: "Rackets",
          parentId: "dept-padel",
          subcategories: [],
        },
      ],
    },
    {
      _id: "dept-badminton",
      name: "Badminton",
      parentId: null,
      categories: [
        {
          _id: "cat-badminton-rackets",
          name: "Rackets",
          parentId: "dept-badminton",
          subcategories: [],
        },
      ],
    },
  ],
}

const products = [
  { _id: "p-shoe", name: "Spike", department: "Footwear", category: "Cricket Shoes", departmentId: "stale-dept" },
  { _id: "p-tape-bat", name: "Tape bat", department: "Cricket", category: "Tape Ball", subCategory: "Bats" },
  { _id: "p-hard-bat", name: "Hard bat", department: "Cricket", category: "Hard Ball", subCategory: "Bats" },
  { _id: "p-padel", name: "Padel racket", department: "Padel", category: "Rackets" },
  { _id: "p-badminton", name: "Badminton racket", department: "Badminton", category: "Rackets" },
  { _id: "p-legacy", name: "Legacy shoe", group: "Footwear", subGroup: "Cricket Shoes" },
]

function ids(list: { _id: string }[]) {
  return list.map((item) => item._id).sort()
}

test("classifyProduct uses new fields and falls back to group/subGroup", () => {
  assert.equal(classifyProduct({ department: "Cricket", category: "Tape Ball", subCategory: "Bats" }).department, "Cricket")
  assert.equal(classifyProduct({ group: "Footwear", subGroup: "Cricket Shoes" }).department, "Footwear")
  assert.equal(classifyProduct({ group: "Footwear", subGroup: "Cricket Shoes" }).category, "Cricket Shoes")
  assert.equal(formatClassification({ department: "Cricket", category: "Tape Ball", subCategory: "Bats" }), "Cricket · Tape Ball · Bats")
})

test("asId accepts strings and Mongo-like objects", () => {
  assert.equal(asId("abc"), "abc")
  assert.equal(asId({ $oid: "hexid" }), "hexid")
  assert.equal(asId(""), "")
  assert.equal(asId(null), "")
})

test("selecting a department loads every product in it, including stale IDs and legacy group fields", () => {
  const matched = productsMatchingNodes(products, ["dept-footwear"], tree)
  assert.deepEqual(ids(matched), ["p-legacy", "p-shoe"])
})

test("selecting a category loads only that branch", () => {
  const matched = productsMatchingNodes(products, ["cat-tape"], tree)
  assert.deepEqual(ids(matched), ["p-tape-bat"])
})

test("selecting a subcategory does not pull the same name from a sibling category", () => {
  const matched = productsMatchingNodes(products, ["sub-tape-bats"], tree)
  assert.deepEqual(ids(matched), ["p-tape-bat"])
})

test("same category name in two departments stays distinct", () => {
  const padel = productsMatchingNodes(products, ["cat-padel-rackets"], tree)
  const badminton = productsMatchingNodes(products, ["cat-badminton-rackets"], tree)
  assert.deepEqual(ids(padel), ["p-padel"])
  assert.deepEqual(ids(badminton), ["p-badminton"])
})

test("mixed department, category, and subcategory narrow the catalog instead of unioning it", () => {
  const cricketOnly = productsMatchingClassification(
    products,
    { departmentIds: ["dept-cricket"], categoryIds: [], subCategoryIds: [] },
    tree,
  )
  assert.deepEqual(ids(cricketOnly), ["p-tape-bat", "p-hard-bat"])

  const cricketTape = productsMatchingClassification(
    products,
    { departmentIds: ["dept-cricket"], categoryIds: ["cat-tape"], subCategoryIds: [] },
    tree,
  )
  assert.deepEqual(ids(cricketTape), ["p-tape-bat"])

  const tapeBats = productsMatchingClassification(
    products,
    { departmentIds: [], categoryIds: ["cat-tape"], subCategoryIds: ["sub-tape-bats"] },
    tree,
  )
  assert.deepEqual(ids(tapeBats), ["p-tape-bat"])

  const footwearCricket = productsMatchingClassification(
    products,
    { departmentIds: ["dept-footwear"], categoryIds: ["cat-tape"], subCategoryIds: [] },
    tree,
  )
  assert.deepEqual(ids(footwearCricket), [])
})

test("any mix of department, category, and subcategory is a union without duplicates", () => {
  const matched = productsMatchingNodes(products, ["dept-footwear", "cat-tape", "sub-tape-bats"], tree)
  assert.deepEqual(ids(matched), ["p-legacy", "p-shoe", "p-tape-bat"])
})

test("empty classification selection loads nothing", () => {
  assert.deepEqual(productsMatchingNodes(products, [], tree), [])
})

test("walkTaxonomy flattens departments, categories, and subcategories", () => {
  const nodes = walkTaxonomy(tree)
  assert.equal(nodes.filter((node) => node.type === "department").length, 4)
  assert.ok(nodes.some((node) => node.id === "sub-tape-bats" && node.pathLabel === "Cricket · Tape Ball · Bats"))
})

test("groupQuoteItems keeps unclassified last and preserves source indexes", () => {
  const grouped = groupQuoteItems(
    [
      { department: "Cricket", category: "Tape Ball", subCategory: "Bats" },
      { department: "", category: "", subCategory: "" },
      { department: "Cricket", category: "Tape Ball", subCategory: "Bats" },
    ],
    [10, 11, 12],
  )
  assert.equal(grouped[0].label, "Cricket · Tape Ball · Bats")
  assert.deepEqual(grouped[0].indexes, [10, 12])
  assert.equal(grouped.at(-1)?.label, "Unclassified")
})

test("quotation item search matches name, sku, and classification", () => {
  const item = { productName: "Tape bat", productId: "KK-9", department: "Cricket", category: "Tape Ball", subCategory: "Bats" }
  assert.equal(quotationItemMatchesQuery(item, ""), true)
  assert.equal(quotationItemMatchesQuery(item, "tape"), true)
  assert.equal(quotationItemMatchesQuery(item, "KK-9"), true)
  assert.equal(quotationItemMatchesQuery(item, "padel"), false)
})

test("merge keeps manual lines, adds catalog lines, and honors removals", () => {
  const toLine = (product: { _id: string }) => ({
    key: `k-${product._id}`,
    productId: product._id,
    source: "catalog" as const,
  })
  const manual = [{ key: "manual-1", productId: "p-custom", source: "manual" as const }]
  const loaded = mergeCatalogLineItems(manual, [{ _id: "p-shoe" }, { _id: "p-tape-bat" }], [], toLine)
  assert.deepEqual(
    loaded.map((item) => item.productId).sort(),
    ["p-custom", "p-shoe", "p-tape-bat"],
  )

  const afterSkip = mergeCatalogLineItems(loaded, [{ _id: "p-shoe" }, { _id: "p-tape-bat" }], ["p-shoe"], toLine)
  assert.ok(!afterSkip.some((item) => item.productId === "p-shoe"))
  assert.ok(afterSkip.some((item) => item.productId === "p-custom"))
  assert.ok(afterSkip.some((item) => item.productId === "p-tape-bat"))

  const afterClear = mergeCatalogLineItems(afterSkip, [], ["p-shoe"], toLine)
  assert.deepEqual(
    afterClear.map((item) => item.productId),
    ["p-custom"],
  )
})

test("quotation numbers and PDF filenames stay stable", () => {
  assert.equal(formatQuotationNo(2026, 7), "KQ-2026-0007")
  assert.equal(quotationYear("2026-09-03T00:00:00+05:00"), 2026)
  assert.match(
    quotationPdfFilename({ customerName: 'Ali / Khan', quotationNo: "KQ-2026-0001", _id: "abc" }),
    /^quotation-Ali-Khan-KQ-2026-0001\.pdf$/,
  )
})

test("quotation status helpers", () => {
  assert.equal(isQuotationStatus("sent"), true)
  assert.equal(isQuotationStatus("draft"), false)
  assert.equal(quotationStatusLabel("returned"), "Returned")
  assert.equal(quotationStatusTone("sent"), "success")
  assert.equal(quotationShowsPrices(false), false)
  assert.equal(quotationShowsPrices(undefined), true)
})

test("product image resolution prefers stored quote images then catalog", () => {
  assert.deepEqual(collectProductImages({ imagePaths: ["a.png", "a.png", "b.png"], imagePath: "c.png" }), ["a.png", "b.png"])
  assert.deepEqual(resolveStoredProductImages({ productImages: ["picked.png"] }, { imagePaths: ["catalog.png"] }), ["picked.png"])
  assert.deepEqual(resolveStoredProductImages({}, { imagePaths: ["catalog.png"] }), ["catalog.png"])
})

test("company reference, names, and tel links", () => {
  assert.equal(COMPANY.name, "KK Sports")
  assert.equal(quotationReference({ quotationNo: "KQ-2026-0001" }), "KQ-2026-0001")
  assert.equal(quotationRefDisplay("6a95a86b3838bbe4822bbf14"), "#822BBF14")
  assert.equal(displayPersonName("mehmood khakwani"), "Mehmood Khakwani")
  assert.equal(telHref("+92 300 1234567"), "tel:+923001234567")
})

test("WhatsApp and IP helpers", () => {
  assert.equal(formatPhoneForWhatsApp("+92 300 1234567"), "923001234567")
  assert.equal(formatPhoneForWhatsApp("03001234567"), "923001234567")
  assert.equal(isValidIP("*"), true)
  assert.equal(isValidIP("10.0.0.1"), true)
  assert.equal(isValidIP("999.1.1.1"), false)
  assert.equal(isIPAllowed("10.0.0.8", ["*"]), true)
  assert.equal(isIPAllowed("10.0.0.8", ["10.0.0.0/24"]), true)
  assert.equal(isIPAllowed("10.0.1.8", ["10.0.0.0/24"]), false)
})

test("quotation PDF builds in memory without a database", async () => {
  const { generateQuotationPdf } = await import("@/lib/quotation-pdf")
  const buffer = await generateQuotationPdf(
    {
      _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
      customerName: "Test Customer",
      customerPhone: "+92 300 0000000",
      customerAddress: "Lahore",
      totalAmount: 100,
      status: "pending",
      createdAt: new Date("2026-09-03"),
      showPrices: true,
      quotationNo: "KQ-2026-0099",
    },
    [{ productId: "KK-1", quantity: 2, price: 50, productName: "Tape bat" }],
  )
  assert.ok(buffer.length > 500)
  assert.equal(buffer.subarray(0, 4).toString(), "%PDF")
})
