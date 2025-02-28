"use client"

import type { TimelinePoint } from "@/lib/types"
import { format } from "date-fns"
import { useMemo, useState } from "react"
import { CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts"

type DataPoint = {
  date: string
  portfolioValue: number
  vtiShares: number
  purchase?: {
    shares: number
    dollars: number
    price: number
  }
  plotPurchase?: {
    shares: number
    dollars: number
    price: number
    portfolioValue: number
  }
}

export default function PerformanceChart({ data }: { data: TimelinePoint[] }) {
  const [timeframe, setTimeframe] = useState<"all" | "1y" | "6m" | "3m">("all");

  // Filter data based on selected timeframe
  const filteredData = useMemo(() => {
    if (timeframe === "all") return data;

    const now = new Date();
    let cutoffDate: Date;

    switch (timeframe) {
      case "1y":
        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case "6m":
        cutoffDate = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case "3m":
        cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      default:
        return data;
    }

    return data.filter((point) => new Date(point.date) >= cutoffDate);
  }, [data, timeframe]);

  const chartData: DataPoint[] = useMemo(() => {
    const data: DataPoint[] = filteredData.map((point) => {
      let purchase;

      if (point.vtiPurchase) {
        purchase = {
          shares: point.vtiPurchase.shares,
          dollars: point.vtiPurchase.shares * point.vtiPurchase.price,
          price: point.vtiPurchase.price,
        };
      }

      return {
        date: format(new Date(point.date), "MMM dd, yyyy"),
        portfolioValue: Number(point.portfolioValue.toFixed(2)),
        vtiShares: point.vtiSharesHeld,
        purchase,
      } satisfies DataPoint;
    })

    // offset the purchases to the previous day so that the indicators are at the bottom of the jumps
    data.forEach((point, index) => {
      if (point.purchase && index > 0) {
        data[index - 1].plotPurchase = {
          shares: point.purchase.shares,
          dollars: point.purchase.dollars,
          price: point.purchase.price,
          portfolioValue: data[index - 1].portfolioValue,
        };
      }
    });

    return data;
  }, [filteredData]);

  console.log(chartData);

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <button
          onClick={() => setTimeframe("all")}
          className={`px-3 py-1 text-sm rounded-md ${
            timeframe === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => setTimeframe("1y")}
          className={`px-3 py-1 text-sm rounded-md ${
            timeframe === "1y"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          1 Year
        </button>
        <button
          onClick={() => setTimeframe("6m")}
          className={`px-3 py-1 text-sm rounded-md ${
            timeframe === "6m"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          6 Months
        </button>
        <button
          onClick={() => setTimeframe("3m")}
          className={`px-3 py-1 text-sm rounded-md ${
            timeframe === "3m"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          3 Months
        </button>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return format(date, "MMM yy");
              }}
            />
            <YAxis
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => [
                `$${value.toLocaleString()}`,
                undefined,
              ]}
              labelFormatter={(label) => `Date: ${label}`}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const dataPoint = payload[0].payload;
                  return (
                    <div className="bg-white border border-gray-200 p-2 rounded shadow-md">
                      <p className="font-medium">{label}</p>
                      <p className="text-sm">
                        Portfolio Value: ${dataPoint.portfolioValue.toLocaleString()}
                      </p>
                      <p className="text-sm">
                        VTI Shares Held: {dataPoint.vtiShares.toFixed(2)}
                      </p>
                      {dataPoint.plotPurchase != null && (
                        <>
                          <p className="text-sm text-green-600 font-medium mt-1">
                            VTI Purchase
                          </p>
                          <p className="text-sm">
                            Shares Purchased:{" "}
                            {dataPoint.plotPurchase.shares.toFixed(2)}
                          </p>
                          <p className="text-sm">
                            Amount Invested: $
                            {dataPoint.plotPurchase.dollars.toLocaleString()}
                          </p>
                          <p className="text-sm">
                            VTI Price: ${dataPoint.plotPurchase.price.toFixed(2)}
                          </p>
                        </>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="portfolioValue"
              name="VTI Portfolio"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: "#82ca9d" }}
              connectNulls={true}
            />
            <Scatter
              name="Robinhood Deposit"
              dataKey="plotPurchase.portfolioValue"
              fill="#8884d8"
              shape="triangle"
              legendType="triangle"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

