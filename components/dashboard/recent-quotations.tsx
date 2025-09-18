"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"

interface RecentQuotation {
  _id: string
  customerName: string
  totalAmount: number
  status: string
  createdAt: string
}

export default function RecentQuotations() {
  const [quotations, setQuotations] = useState<RecentQuotation[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchRecentQuotations()
  }, [])

  const fetchRecentQuotations = async () => {
    try {
      const response = await fetch("/api/quotations?limit=5")
      if (response.ok) {
        const data = await response.json()
        setQuotations(data)
      }
    } catch (error) {
      console.error("Failed to fetch recent quotations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuotationClick = (quotationId: string) => {
    router.push(`/quotations/${quotationId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Quotations</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : quotations.length > 0 ? (
          <div className="space-y-3">
            {quotations.map((quotation) => (
              <div
                key={quotation._id}
                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 hover:shadow-md transition-all duration-200"
                onClick={() => handleQuotationClick(quotation._id)}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">{quotation.customerName}</p>
                    <p className="text-sm text-gray-600">PKR{quotation.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(quotation.status)}>{quotation.status}</Badge>
                  <p className="text-xs text-gray-500 mt-1">{new Date(quotation.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">No recent quotations found</div>
        )}
      </CardContent>
    </Card>
  )
}
