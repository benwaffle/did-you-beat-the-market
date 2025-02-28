"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Scatter } from "recharts"
import type { TimelinePoint, VtiPrice } from "@/lib/types"

interface PerformanceChartProps {
  data: TimelinePoint[]
  vtiPrices: VtiPrice[]
}

export default function PerformanceChart({
  data,
  vtiPrices,
}: PerformanceChartProps) {
  const [timeframe, setTimeframe] = useState<"all" | "1y" | "6m" | "3m">("all");

  const filterData = () => {
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
  };

  // Calculate VTI values based on shares and prices
  const chartData = filterData().map((point, index, arr) => {
    // Find the exact VTI price for this date
    const pointDate = new Date(point.date);
    const dateStr = pointDate.toISOString().split("T")[0];

    const exactVtiPrice = vtiPrices.find(
      (price) => price.date.toISOString().split("T")[0] === dateStr
    );

    if (!exactVtiPrice) {
      throw new Error(
        `No VTI price available for date: ${dateStr}. Cannot calculate VTI value.`
      );
    }

    const vtiValue = point.vtiShares * exactVtiPrice.price;
    
    // Calculate shares purchased and dollars invested if this is a purchase point
    let sharesPurchased = 0;
    let dollarsInvested = 0;
    
    if (point.isVtiPurchase && index > 0) {
      sharesPurchased = point.vtiShares - arr[index - 1].vtiShares;
      // Calculate approximate dollars invested based on VTI price at that time
      dollarsInvested = sharesPurchased * exactVtiPrice.price;
    }

    return {
      ...point,
      date: format(new Date(point.date), "MMM dd, yyyy"),
      vtiValue: Number(vtiValue.toFixed(2)),
      // For scatter plot - only show a value if it's a purchase point
      purchaseValue: point.isVtiPurchase ? vtiValue : null,
      sharesPurchased,
      dollarsInvested: Number(dollarsInvested.toFixed(2)),
      vtiPrice: exactVtiPrice.price
    };
  });
    
  // Debug logging
  useEffect(() => {
    console.log("Timeline data:", data);
    console.log("Chart data:", chartData);
    console.log("VTI purchase flags:", chartData.map(point => point.isVtiPurchase));
    console.log("Purchase values:", chartData.map(point => point.purchaseValue));
  }, [data, chartData]);

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
                        VTI Value: ${dataPoint.vtiValue.toLocaleString()}
                      </p>
                      <p className="text-sm">
                        Total VTI Shares: {dataPoint.vtiShares.toFixed(2)}
                      </p>
                      {dataPoint.isVtiPurchase && (
                        <>
                          <p className="text-sm text-green-600 font-medium mt-1">
                            VTI Purchase
                          </p>
                          {dataPoint.sharesPurchased > 0 && (
                            <>
                              <p className="text-sm">
                                Shares Purchased: {dataPoint.sharesPurchased.toFixed(2)}
                              </p>
                              <p className="text-sm">
                                Amount Invested: ${dataPoint.dollarsInvested.toLocaleString()}
                              </p>
                              <p className="text-sm">
                                VTI Price: ${dataPoint.vtiPrice.toFixed(2)}
                              </p>
                            </>
                          )}
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
              dataKey="vtiValue"
              name="VTI Buy & Hold"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={false}
            />
            
            {/* Add scatter points for purchases */}
            <Scatter
              name="VTI Purchase"
              dataKey="purchaseValue"
              fill="#4CAF50"
              shape="star"
              legendType="star"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

