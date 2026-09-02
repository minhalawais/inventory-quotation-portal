"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { ChevronDown, LogOut, Menu, UserRound } from "lucide-react"

import IPStatusIndicator from "@/components/ip-status-indicator"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/products": "Products",
  "/products/add": "Add product",
  "/products/classifications": "Classifications",
  "/quotations": "Quotations",
  "/quotations/create": "Create quotation",
  "/users": "Users",
  "/users/add": "Add user",
  "/logs": "Activity logs",
  "/out-of-stock": "Stock exceptions",
}

function getPageName(pathname: string) {
  return (
    pageNames[pathname] ??
    (pathname.startsWith("/products/edit/") ? "Edit product" : undefined) ??
    (pathname.startsWith("/users/edit/") ? "Edit user" : undefined) ??
    (pathname.startsWith("/quotations/") ? "Quotation details" : undefined) ??
    "Operations"
  )
}

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session || pathname.startsWith("/auth")) return null

  const pageName = getPageName(pathname)
  const initials =
    session.user.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U"

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-border bg-white lg:h-16">
      <div className="flex w-full items-center justify-between gap-4 px-4 sm:px-5 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            id="mobile-menu-trigger"
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="shrink-0 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex min-w-0 items-center gap-2 text-xs">
              <li className="hidden text-muted-foreground sm:block">KK Sports Operations</li>
              <li className="hidden text-border sm:block" aria-hidden="true">/</li>
              <li className="truncate font-semibold text-foreground" aria-current="page">{pageName}</li>
            </ol>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden xl:block">
            <IPStatusIndicator />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 gap-2 px-1.5 sm:px-2" aria-label="Open account menu">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-xs font-bold text-background">
                  {initials}
                </span>
                <span className="hidden max-w-36 text-left sm:block">
                  <span className="block truncate text-xs font-semibold leading-4 text-foreground">{session.user.name}</span>
                  <span className="block truncate text-[11px] font-normal capitalize leading-4 text-muted-foreground">
                    {session.user.role.replace(/_/g, " ")}
                  </span>
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <span className="block text-sm font-semibold text-foreground">{session.user.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{session.user.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={session.user.role === "manager" ? "/dashboard" : "/products"}>
                  <UserRound className="mr-2 h-4 w-4" />
                  Operations home
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/auth/signin" })} className="text-red-700 focus:text-red-700">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
