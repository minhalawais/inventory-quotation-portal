"use client"

import { useMemo, useState } from "react"
import { FolderTree, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ErrorState } from "@/components/shared/empty-state"
import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { logActivity } from "@/lib/logger"
import { cn } from "@/lib/utils"
import type { TaxonomyNode, TaxonomyType } from "@/lib/product-classification"
import { useTaxonomy } from "@/components/products/use-taxonomy"

type Level = TaxonomyType

interface DraftItem {
  id?: string
  name: string
  type: Level
  parentId: string | null
}

export default function ClassificationManager() {
  const { tree, loading, error, refetch } = useTaxonomy()
  const { toast } = useToast()
  const { data: session } = useSession()
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<DraftItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DraftItem | null>(null)
  const [newName, setNewName] = useState<Record<Level, string>>({
    department: "",
    category: "",
    subcategory: "",
  })

  const selectedDepartment = tree.departments.find((item) => item._id === selectedDepartmentId) ?? null
  const categories = selectedDepartment?.categories ?? []
  const selectedCategory = categories.find((item) => item._id === selectedCategoryId) ?? null
  const subcategories = selectedCategory?.subcategories ?? []

  const counts = useMemo(
    () => ({
      departments: tree.departments.length,
      categories: categories.length,
      subcategories: subcategories.length,
    }),
    [tree.departments.length, categories.length, subcategories.length],
  )

  const submit = async (item: DraftItem) => {
    const name = item.name.trim()
    if (!name) {
      toast({ title: "Name required", description: "Enter a name before saving.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const isEdit = Boolean(item.id)
      const response = await fetch(isEdit ? `/api/taxonomy/${item.id}` : "/api/taxonomy", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: item.type,
          name,
          parentId: item.parentId,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to save")
      }

      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: isEdit ? "UPDATE" : "CREATE",
          resource: "Classification",
          resourceId: item.id,
          details: `${isEdit ? "Renamed" : "Added"} ${item.type}: ${name}`,
          status: "success",
        })
      }

      toast({ title: isEdit ? "Option updated" : "Option added" })
      setDraft(null)
      setNewName((prev) => ({ ...prev, [item.type]: "" }))
      await refetch()
    } catch (err) {
      toast({
        title: "Could not save",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item: DraftItem) => {
    if (!item.id) return
    setSaving(true)
    try {
      const response = await fetch(`/api/taxonomy/${item.id}`, { method: "DELETE" })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete")
      }

      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "DELETE",
          resource: "Classification",
          resourceId: item.id,
          details: `Deleted ${item.type}: ${item.name}`,
          status: "success",
        })
      }

      if (item.type === "department" && selectedDepartmentId === item.id) {
        setSelectedDepartmentId(null)
        setSelectedCategoryId(null)
      }
      if (item.type === "category" && selectedCategoryId === item.id) {
        setSelectedCategoryId(null)
      }

      toast({ title: "Option deleted" })
      setDeleteTarget(null)
      await refetch()
    } catch (err) {
      toast({
        title: "Could not delete",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <Panel key={key}>
            <PanelHeader>
              <Skeleton className="h-5 w-28" />
            </PanelHeader>
            <PanelBody className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </PanelBody>
          </Panel>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Panel>
        <ErrorState
          icon={FolderTree}
          title="Could not load classifications"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </Panel>
    )
  }

  const renderList = (
    items: TaxonomyNode[],
    type: Level,
    selectedId: string | null,
    onSelect: (id: string) => void,
    parentId: string | null,
    emptyDescription: string,
    addDisabled?: boolean,
    addDisabledReason?: string,
  ) => (
    <div className="flex h-full min-h-[320px] flex-col">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (addDisabled) return
          void submit({ type, name: newName[type], parentId })
        }}
      >
        <Input
          value={newName[type]}
          onChange={(event) => setNewName((prev) => ({ ...prev, [type]: event.target.value }))}
          placeholder={`Add ${type}`}
          className="h-10"
          disabled={addDisabled || saving}
          aria-label={`New ${type} name`}
        />
        <Button type="submit" className="h-10 shrink-0" disabled={addDisabled || saving || !newName[type].trim()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add
        </Button>
      </form>
      {addDisabled && addDisabledReason && (
        <p className="mt-2 text-xs text-muted-foreground">{addDisabledReason}</p>
      )}

      <div className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="px-1.5 py-4 text-xs text-muted-foreground">{emptyDescription}</p>
        ) : (
          items.map((item) => (
            <div
              key={item._id}
              className={cn(
                "flex h-9 items-center gap-1 rounded-md px-1.5",
                selectedId === item._id ? "bg-muted" : "hover:bg-muted/60",
              )}
            >
              <button
                type="button"
                className="min-w-0 flex-1 truncate px-1.5 text-left text-sm font-medium"
                onClick={() => onSelect(item._id)}
              >
                {item.name}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Rename ${item.name}`}
                onClick={() => setDraft({ id: item._id, name: item.name, type, parentId })}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                aria-label={`Delete ${item.name}`}
                onClick={() => setDeleteTarget({ id: item._id, name: item.name, type, parentId })}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const departmentColumn = renderList(
    tree.departments,
    "department",
    selectedDepartmentId,
    (id) => {
      setSelectedDepartmentId(id)
      setSelectedCategoryId(null)
    },
    null,
    "Add a department to start the catalog tree.",
  )

  const categoryColumn = renderList(
    categories,
    "category",
    selectedCategoryId,
    (id) => setSelectedCategoryId(id),
    selectedDepartmentId,
    selectedDepartment
      ? `Add categories under ${selectedDepartment.name}.`
      : "Choose a department first.",
    !selectedDepartmentId,
    selectedDepartmentId ? undefined : "Select a department first.",
  )

  const subcategoryColumn = renderList(
    subcategories,
    "subcategory",
    null,
    () => undefined,
    selectedCategoryId,
    selectedCategory
      ? `Add subcategories under ${selectedCategory.name}.`
      : "Choose a category first.",
    !selectedCategoryId,
    selectedCategoryId ? undefined : "Select a category first.",
  )

  return (
    <>
      <div className="hidden gap-4 lg:grid lg:grid-cols-3">
        <Panel>
          <PanelHeader className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Departments</h2>
            <span className="text-xs tabular-nums text-muted-foreground">{counts.departments}</span>
          </PanelHeader>
          <PanelBody>{departmentColumn}</PanelBody>
        </Panel>
        <Panel>
          <PanelHeader className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Categories</h2>
            <span className="text-xs tabular-nums text-muted-foreground">{counts.categories}</span>
          </PanelHeader>
          <PanelBody>{categoryColumn}</PanelBody>
        </Panel>
        <Panel>
          <PanelHeader className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Subcategories</h2>
            <span className="text-xs tabular-nums text-muted-foreground">{counts.subcategories}</span>
          </PanelHeader>
          <PanelBody>{subcategoryColumn}</PanelBody>
        </Panel>
      </div>

      <Panel className="lg:hidden">
        <PanelBody className="pt-3">
          <Tabs defaultValue="department">
            <TabsList className="grid h-9 w-full grid-cols-3">
              <TabsTrigger value="department" className="text-xs">
                Departments
              </TabsTrigger>
              <TabsTrigger value="category" className="text-xs">
                Categories
              </TabsTrigger>
              <TabsTrigger value="subcategory" className="text-xs">
                Subcategories
              </TabsTrigger>
            </TabsList>
            <TabsContent value="department" className="mt-3">
              {departmentColumn}
            </TabsContent>
            <TabsContent value="category" className="mt-3">
              {categoryColumn}
            </TabsContent>
            <TabsContent value="subcategory" className="mt-3">
              {subcategoryColumn}
            </TabsContent>
          </Tabs>
        </PanelBody>
      </Panel>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename {draft?.type}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-option">Name</Label>
            <Input
              id="rename-option"
              value={draft?.name ?? ""}
              onChange={(event) => setDraft((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
              className="h-10"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDraft(null)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => draft && void submit(draft)} disabled={saving || !draft?.name.trim()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[440px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This option will be removed. Delete is blocked if products or child options still use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && void remove(deleteTarget)}
              disabled={saving}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
