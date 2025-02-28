"use client"

import { useState } from "react"
import { format } from "date-fns"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import type { TimelinePoint } from "@/lib/types"

interface PerformanceChartProps {
  data: TimelinePoint[]
  showPortfolio?: boolean
}

export default function PerformanceChart({ data, showPortfolio = true }: PerformanceChartProps) {
  const [timeframe, setTimeframe] = useState<"all" | "1y" | "6m" | "3m">("all")

  const filterData = () => {
    if (timeframe === "all") return data

    const now = new Date()
    let cutoffDate: Date

    switch (timeframe) {
      case "1y":
        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1))
        break
      case "6m":
        cutoffDate = new Date(now.setMonth(now.getMonth() - 6))
        break
      case "3m":
        cutoffDate = new Date(now.setMonth(now.getMonth() - 3))
        break
      default:
        return data
    }

    return data.filter((point) => new Date(point.date) >= cutoffDate)
  }

  const chartData = filterData().map((point) => ({
    ...point,
    date: format(new Date(point.date), "MMM dd, yyyy"),
    vtiValue: Number(point.vtiValue.toFixed(2)),
  }))

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <button
          onClick={() => setTimeframe("all")}
          className={`px-3 py-1 text-sm rounded-md ${
            timeframe === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => setTimeframe("1y")}
          className={`px-3 py-1 text-sm rounded-md ${
            timeframe === "1y" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          1 Year
        </button>
        <button
          onClick={() => setTimeframe("6m")}
          className={`px-3 py-1 text-sm rounded-md ${
            timeframe === "6m" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          6 Months
        </button>
        <button
          onClick={() => setTimeframe("3m")}
          className={`px-3 py-1 text-sm rounded-md ${
            timeframe === "3m" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          3 Months
        </button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return format(date, "MMM yy")
                  }}
                />
                <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                {showPortfolio && (
                  <Line
                    type="monotone"
                    dataKey="portfolioValue"
                    name="Your Portfolio"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                )}
                <Line type="monotone" dataKey="vtiValue" name="VTI Buy & Hold" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

