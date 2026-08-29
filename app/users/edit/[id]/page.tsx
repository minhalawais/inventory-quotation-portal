import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import EditUserForm from "@/components/users/edit-user-form"
import { ArrowLeft, UserCog } from "lucide-react"
import { PageHeading } from "@/components/layout/page-heading"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface EditUserPageProps {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "manager") {
    redirect("/auth/signin")
  }

  const { id } = await params

  return (
    <div className="space-y-6">
      <PageHeading title="Edit user" description="Update account details, permissions, and access rules." icon={UserCog} actions={
        <Button variant="outline" asChild><Link href="/users"><ArrowLeft className="h-4 w-4" /> Back to users</Link></Button>
      } />
      <EditUserForm userId={id} />
    </div>
  )
}
