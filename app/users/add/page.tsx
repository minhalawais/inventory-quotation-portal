import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Add user",
}
import UserForm from "@/components/users/user-form"
import { ArrowLeft, UserPlus } from "lucide-react"
import { PageHeading } from "@/components/layout/page-heading"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AddUserPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "manager") {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Add user"
        description="Create an account, assign a role, and set network access."
        icon={UserPlus}
        actions={
          <Button variant="outline" asChild>
            <Link href="/users">
              <ArrowLeft className="h-4 w-4" /> Back to users
            </Link>
          </Button>
        }
      />
      <UserForm />
    </div>
  )
}
