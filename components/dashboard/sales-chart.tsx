"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface SalesData {
  month: string
  sales: number
  revenue: number
}

export default function SalesChart() {
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSalesData()
  }, [])

  const fetchSalesData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dashboard/sales")

      if (response.status === 404) {
        console.error("Sales API endpoint not found")
        setSalesData([])
        return
      }

      if (response.ok) {
        const data = await response.json()
        setSalesData(data)
      } else {
        console.error("Failed to fetch sales data:", response.status, response.statusText)
        setSalesData([])
      }
    } catch (error) {
      console.error("Failed to fetch sales data:", error)
      setSalesData([])
    } finally {
      setLoading(false)
    }
  }

  const formatRevenue = (value: number) => {
    return `PKR${(value / 1000).toFixed(0)}K`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full mx-auto mb-2 animate-spin"></div>
              <p className="text-gray-500">Loading sales data...</p>
            </div>
          </div>
        ) : salesData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="sales" orientation="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="revenue" orientation="right" tick={{ fontSize: 12 }} tickFormatter={formatRevenue} />
                <Tooltip
                  formatter={(value, name) => [
                    name === "sales" ? `${value} orders` : formatRevenue(Number(value)),
                    name === "sales" ? "Sales" : "Revenue",
                  ]}
                />
                <Legend 
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (
                    <span className="text-sm">
                      {value === "sales" ? "Sales (orders)" : "Revenue (PKR)"}
                    </span>
                  )}
                />
                <Line
                  name="sales"
                  yAxisId="sales"
                  type="monotone"
                  dataKey="sales"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  name="revenue"
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-gray-400 mb-2">📊</div>
              <p className="text-gray-600">No sales data available</p>
              <p className="text-sm text-gray-500">Start creating quotations to see trends</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}