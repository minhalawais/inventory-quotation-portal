import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import UserList from "@/components/users/user-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { Users } from "lucide-react"
import { PageHeading } from "@/components/layout/page-heading"

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "manager") {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <PageHeading title="User access" description="Manage roles, availability, and network access rules." icon={Users} actions={
        <Button asChild><Link href="/users/add"><Plus className="h-4 w-4" /> Add user</Link></Button>
      } />

      <UserList />
    </div>
  )
}
