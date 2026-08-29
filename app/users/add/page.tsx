import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import UserForm from "@/components/users/user-form"
import { UserPlus } from "lucide-react"
import { PageHeading } from "@/components/layout/page-heading"

export default async function AddUserPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "manager") {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <PageHeading title="Add user" description="Create an account and define its access boundaries." icon={UserPlus} />
      <UserForm />
    </div>
  )
}
