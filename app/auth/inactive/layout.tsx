import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Account inactive",
}

export default function InactiveLayout({ children }: { children: React.ReactNode }) {
  return children
}
