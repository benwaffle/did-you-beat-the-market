"use client"

import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react"
import type { ComparisonResult } from "@/lib/types"

interface SummaryStatsProps {
  comparisonResult: ComparisonResult
}

export default function SummaryStats({ comparisonResult }: SummaryStatsProps) {
  const {
    totalInvested,
    endValue,
    vtiEndValue,
    portfolioReturn,
    vtiReturn,
    annualizedPortfolioReturn,
    annualizedVtiReturn,
    outperformance,
    beatMarket,
    years,
  } = comparisonResult

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
  }

  return (
    <div className={`p-4 rounded-lg border ${beatMarket ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium flex items-center">
          {beatMarket ? (
            <>
              <TrendingUp className="mr-2 h-6 w-6 text-green-500" />
              <span>You Beat the Market!</span>
            </>
          ) : (
            <>
              <TrendingDown className="mr-2 h-6 w-6 text-red-500" />
              <span>The Market Beat You</span>
            </>
          )}
        </h3>
        <p className="text-sm text-gray-600">
          {beatMarket
            ? `Your portfolio outperformed VTI by ${formatPercentage(outperformance)}`
            : `Your portfolio underperformed VTI by ${formatPercentage(Math.abs(outperformance))}`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-lg">
        <div>
          <h3 className="text-lg font-medium mb-4">Your Portfolio</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total Cash Invested</p>
              <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Value</p>
              <p className="text-2xl font-bold">{formatCurrency(endValue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Return</p>
              <div className="flex items-center">
                <p className={`text-2xl font-bold ${portfolioReturn >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatPercentage(portfolioReturn)}
                </p>
                {portfolioReturn >= 0 ? (
                  <ArrowUpRight className="ml-1 h-5 w-5 text-green-600" />
                ) : (
                  <ArrowDownRight className="ml-1 h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Annualized Return</p>
              <div className="flex items-center">
                <p
                  className={`text-2xl font-bold ${annualizedPortfolioReturn >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatPercentage(annualizedPortfolioReturn)}
                </p>
                {annualizedPortfolioReturn >= 0 ? (
                  <ArrowUpRight className="ml-1 h-5 w-5 text-green-600" />
                ) : (
                  <ArrowDownRight className="ml-1 h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">VTI Buy & Hold</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total Cash Invested</p>
              <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Value</p>
              <p className="text-2xl font-bold">{formatCurrency(vtiEndValue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Return</p>
              <div className="flex items-center">
                <p className={`text-2xl font-bold ${vtiReturn >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatPercentage(vtiReturn)}
                </p>
                {vtiReturn >= 0 ? (
                  <ArrowUpRight className="ml-1 h-5 w-5 text-green-600" />
                ) : (
                  <ArrowDownRight className="ml-1 h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Annualized Return</p>
              <div className="flex items-center">
                <p className={`text-2xl font-bold ${annualizedVtiReturn >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatPercentage(annualizedVtiReturn)}
                </p>
                {annualizedVtiReturn >= 0 ? (
                  <ArrowUpRight className="ml-1 h-5 w-5 text-green-600" />
                ) : (
                  <ArrowDownRight className="ml-1 h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Analysis period: {years.toFixed(1)} years ({formatPercentage(annualizedPortfolioReturn)} vs{" "}
        {formatPercentage(annualizedVtiReturn)} annualized)
      </div>
    </div>
  )
}

