"use client"

import type { ReactNode } from "react"
import { Fragment, useMemo, useState } from "react"
import { Minus, Plus } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { QuotationProductImage } from "@/components/quotations/quotation-product-image"
import { StatusBadge } from "@/components/shared/status-badge"
import { ProductThumb } from "@/components/shared/product-thumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  COMPANY,
  displayPersonName,
  formatAmount,
  formatPkr,
  formatQuotationDate,
  quotationRefDisplay,
  telHref,
  validUntilDate,
} from "@/lib/company"
import { quotationStatusLabel, quotationStatusTone } from "@/lib/quotation"
import {
  QUOTE_COMPACT_THRESHOLD,
  QUOTE_FIND_THRESHOLD,
  groupQuoteItems,
  quotationItemMatchesQuery,
} from "@/lib/quotation-catalog"
import { cn } from "@/lib/utils"

export interface QuotationDocumentItem {
  productId: string
  quantity: number
  price: number
  productName?: string
  productImage?: string | null
  productImages?: string[]
  sentQuantity?: number
  department?: string
  category?: string
  subCategory?: string
}

export interface QuotationDocumentRider {
  _id?: string
  name: string
  email?: string
  phone?: string
}

export interface QuotationDocumentModel {
  _id: string
  customerName: string
  customerPhone: string
  customerAddress: string
  totalAmount: number
  status: string
  createdAt: string | Date
  items: QuotationDocumentItem[]
  quotationNo?: string | null
  rider?: QuotationDocumentRider | null
}

interface QuantityEditor {
  quantities: number[]
  onChange: (index: number, quantity: number) => void
}

interface QuotationDocumentProps {
  quotation: QuotationDocumentModel
  /** Show product thumbnails (screen); omit/compact for print via CSS. */
  showImages?: boolean
  /** Customer copy without unit/line/total amounts. Internal views keep prices. */
  showPrices?: boolean
  quantityEditor?: QuantityEditor
  className?: string
  footerNote?: ReactNode
}

function itemImages(item: QuotationDocumentItem) {
  if (Array.isArray(item.productImages)) return item.productImages
  if (item.productImage) return [item.productImage]
  return []
}

function QtyStepper({
  value,
  onChange,
}: {
  value: number
  onChange: (quantity: number) => void
}) {
  return (
    <div className="inline-flex items-center justify-end gap-1 print:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(Math.max(1, value - 1))}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
        className="h-8 w-14 px-1 text-center tabular-nums"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

function PreviousQty({ sentQuantity, quantity }: { sentQuantity?: number; quantity: number }) {
  if (sentQuantity == null || sentQuantity === quantity) return null
  return <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">Was {sentQuantity}</p>
}

function ContactLink({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  const textClass = cn("mt-1 text-sm text-muted-foreground", className)
  if (!href) {
    return <p className={textClass}>{children}</p>
  }
  return (
    <p className={textClass}>
      <a href={href} className="hover:text-foreground print:no-underline">
        {children}
      </a>
    </p>
  )
}

function ItemPhoto({
  images,
  alt,
  compact,
  staticThumb,
}: {
  images: string[]
  alt: string
  compact: boolean
  staticThumb: boolean
}) {
  if (staticThumb) {
    return <ProductThumb src={images[0] || null} alt={alt} className={compact ? "h-10 w-10" : "h-12 w-12"} />
  }
  return (
    <QuotationProductImage
      images={images}
      alt={alt}
      className={compact ? "h-10 w-10" : undefined}
    />
  )
}

/** Shared KK Sports quotation document for modal, public page, and print. */
export function QuotationDocument({
  quotation,
  showImages = true,
  showPrices = true,
  quantityEditor,
  className,
  footerNote,
}: QuotationDocumentProps) {
  const ref = quotationRefDisplay(quotation)
  const issued = formatQuotationDate(quotation.createdAt)
  const validUntil = validUntilDate(quotation.createdAt)
  const customerName = displayPersonName(quotation.customerName)
  const riderName = quotation.rider?.name ? displayPersonName(quotation.rider.name) : ""
  const customerTel = telHref(quotation.customerPhone)
  const riderTel = quotation.rider?.phone ? telHref(quotation.rider.phone) : ""
  const [itemQuery, setItemQuery] = useState("")
  const displayItems = quotation.items.map((item, index) => {
    const quantity = quantityEditor ? quantityEditor.quantities[index] ?? item.quantity : item.quantity
    return { ...item, quantity, line: quantity * item.price }
  })
  const computedTotal = displayItems.reduce((sum, item) => sum + item.line, 0)
  const total = quantityEditor ? computedTotal : quotation.totalAmount || computedTotal
  const compact = displayItems.length >= QUOTE_COMPACT_THRESHOLD
  const useStaticThumbs = compact || displayItems.length >= QUOTE_FIND_THRESHOLD
  const groups = useMemo(() => {
    const visibleIndexes = displayItems
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => quotationItemMatchesQuery(item, itemQuery))
      .map(({ index }) => index)
    return groupQuoteItems(
      visibleIndexes.map((index) => displayItems[index]),
      visibleIndexes,
    )
  }, [displayItems, itemQuery])
  const showFind = displayItems.length >= QUOTE_FIND_THRESHOLD
  const showGroups = groups.length > 1

  return (
    <article
      className={cn(
        "quotation-document overflow-hidden rounded-lg border border-border bg-card text-foreground",
        className,
      )}
    >
      <header className="border-b border-border px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <BrandMark subtitle={false} />
          <div className="sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">Quotation</p>
            <p className="mt-0.5 font-mono text-base font-semibold">{ref}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 sm:justify-end">
              <StatusBadge tone={quotationStatusTone(quotation.status)}>
                {quotationStatusLabel(quotation.status)}
              </StatusBadge>
            </div>
            {showPrices && (
              <p className="mt-2 text-base font-bold tabular-nums">{formatPkr(total)}</p>
            )}
          </div>
        </div>
      </header>

      <div
        className={cn(
          "grid gap-5 border-b border-border px-5 py-4 sm:px-6",
          quotation.rider ? "sm:grid-cols-3" : "sm:grid-cols-2",
        )}
      >
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">Bill to</h3>
          <p className="mt-2 text-sm font-semibold">{customerName}</p>
          <ContactLink href={customerTel}>{quotation.customerPhone}</ContactLink>
          <p className="mt-1 text-sm text-muted-foreground break-words">{quotation.customerAddress}</p>
        </section>
        {quotation.rider && (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
              Sales representative
            </h3>
            <p className="mt-2 text-sm font-semibold">{riderName}</p>
            {quotation.rider.phone && <ContactLink href={riderTel}>{quotation.rider.phone}</ContactLink>}
            {quotation.rider.email && (
              <ContactLink href={`mailto:${quotation.rider.email}`}>{quotation.rider.email}</ContactLink>
            )}
          </section>
        )}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">Dates</h3>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted-foreground">Issued</dt>
              <dd className="font-medium sm:mt-0.5">{issued}</dd>
            </div>
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted-foreground">Valid until</dt>
              <dd className="font-medium sm:mt-0.5">{validUntil}</dd>
            </div>
          </dl>
        </section>
      </div>

      {showFind && (
        <div className="border-b border-border px-5 py-3 print:hidden sm:px-6">
          <Input
            value={itemQuery}
            onChange={(event) => setItemQuery(event.target.value)}
            placeholder={`Find in ${displayItems.length} items`}
            className="h-10"
          />
        </div>
      )}

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
              {showImages && (
                <th className={cn("px-5 py-2.5 sm:px-6", compact ? "w-[56px]" : "w-[88px]")}>
                  <span className="sr-only">Photo</span>
                </th>
              )}
              <th className="px-5 py-2.5 sm:px-6">Item</th>
              <th className="px-3 py-2.5 text-right">Qty</th>
              {showPrices && <th className="px-3 py-2.5 text-right">Unit</th>}
              {showPrices && <th className="px-5 py-2.5 text-right sm:px-6">Amount</th>}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const groupTotal = group.indexes.reduce((sum, index) => sum + displayItems[index].line, 0)
              const colSpan =
                2 + (showImages ? 1 : 0) + (showPrices ? 2 : 0)
              return (
                <Fragment key={group.key}>
                  {showGroups && (
                    <tr className="border-b border-border bg-muted/40">
                      <td colSpan={colSpan} className="px-5 py-2 sm:px-6">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold">
                            {group.label}
                            <span className="ml-2 font-normal text-muted-foreground tabular-nums">
                              {group.indexes.length}
                            </span>
                          </p>
                          {showPrices && (
                            <p className="text-xs font-medium tabular-nums">{formatAmount(groupTotal)}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  {group.indexes.map((index) => {
                    const item = displayItems[index]
                    const images = itemImages(item)
                    const pad = compact ? "py-2" : "py-3"
                    return (
                      <tr key={`${group.key}-${index}`} className="border-b border-border last:border-0">
                        {showImages && (
                          <td className={cn("px-5 sm:px-6 print:hidden", pad)}>
                            <ItemPhoto
                              images={images}
                              alt={item.productName || "Product"}
                              compact={compact}
                              staticThumb={useStaticThumbs}
                            />
                          </td>
                        )}
                        <td className={cn("px-5 sm:px-6", pad)}>
                          <p className="font-medium break-words">{item.productName || "Product"}</p>
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">#{item.productId}</p>
                        </td>
                        <td className={cn("px-3 text-right", pad)}>
                          {quantityEditor ? (
                            <>
                              <span className="hidden tabular-nums print:inline">{item.quantity}</span>
                              <QtyStepper
                                value={item.quantity}
                                onChange={(quantity) => quantityEditor.onChange(index, quantity)}
                              />
                            </>
                          ) : (
                            <span className="tabular-nums">{item.quantity}</span>
                          )}
                          <PreviousQty sentQuantity={item.sentQuantity} quantity={item.quantity} />
                        </td>
                        {showPrices && (
                          <td className={cn("px-3 text-right tabular-nums", pad)}>{formatAmount(item.price)}</td>
                        )}
                        {showPrices && (
                          <td className={cn("px-5 text-right font-medium tabular-nums sm:px-6", pad)}>
                            {formatAmount(item.line)}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </Fragment>
              )
            })}
          </tbody>
        </table>
        {showFind && itemQuery.trim() && groups.every((group) => group.indexes.length === 0) && (
          <p className="px-5 py-6 text-center text-sm text-muted-foreground print:hidden">No items match that search.</p>
        )}
      </div>

      <div className="space-y-3 border-b border-border px-4 py-4 sm:hidden">
        {groups.map((group) => {
          const groupTotal = group.indexes.reduce((sum, index) => sum + displayItems[index].line, 0)
          return (
            <div key={group.key} className="space-y-2">
              {showGroups && (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold">
                    {group.label}
                    <span className="ml-2 font-normal text-muted-foreground tabular-nums">{group.indexes.length}</span>
                  </p>
                  {showPrices && <p className="text-xs font-medium tabular-nums">{formatAmount(groupTotal)}</p>}
                </div>
              )}
              {group.indexes.map((index) => {
                const item = displayItems[index]
                const images = itemImages(item)
                return (
                  <div key={`${group.key}-${index}`} className="flex gap-3 rounded-md border border-border p-3">
                    {showImages && (
                      <ItemPhoto
                        images={images}
                        alt={item.productName || "Product"}
                        compact={compact}
                        staticThumb={useStaticThumbs}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium break-words">{item.productName || "Product"}</p>
                      <p className="font-mono text-xs text-muted-foreground">#{item.productId}</p>
                      {quantityEditor ? (
                        <div className="mt-2">
                          <QtyStepper
                            value={item.quantity}
                            onChange={(quantity) => quantityEditor.onChange(index, quantity)}
                          />
                          <PreviousQty sentQuantity={item.sentQuantity} quantity={item.quantity} />
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Qty {item.quantity}
                          {item.sentQuantity != null && item.sentQuantity !== item.quantity
                            ? ` · was ${item.sentQuantity}`
                            : ""}
                          {showPrices ? ` × ${formatAmount(item.price)}` : ""}
                        </p>
                      )}
                      {showPrices && (
                        <p className="mt-1 text-sm font-semibold tabular-nums">{formatAmount(item.line)}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {showPrices && (
        <div className="flex justify-end border-b border-border px-5 py-4 sm:px-6">
          <div className="flex w-full max-w-xs justify-between gap-4 text-base font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatPkr(total)}</span>
          </div>
        </div>
      )}

      <div className="grid gap-4 px-5 py-4 text-xs text-muted-foreground sm:grid-cols-2 sm:px-6">
        <div>
          <p className="font-semibold text-foreground">Terms</p>
          <p className="mt-1 leading-5">
            {showPrices ? "Prices are in Pakistani Rupees (PKR). " : ""}
            Stock availability is subject to confirmation at order time.
          </p>
          {footerNote}
        </div>
        <div className="sm:text-right">
          <p className="font-semibold text-foreground">{COMPANY.name}</p>
          <p className="mt-1">{COMPANY.address}</p>
          <ContactLink href={telHref(COMPANY.phone)} className="text-xs">
            {COMPANY.phoneDisplay}
          </ContactLink>
          <ContactLink href={`mailto:${COMPANY.email}`} className="text-xs">
            {COMPANY.email}
          </ContactLink>
          <p className="mt-1">
            <a href={COMPANY.websiteUrl} className="hover:text-foreground print:no-underline" target="_blank" rel="noreferrer">
              {COMPANY.website}
            </a>
          </p>
        </div>
      </div>
    </article>
  )
}
