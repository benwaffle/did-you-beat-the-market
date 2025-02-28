"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="space-y-6">
      <Card className={beatMarket ? "border-green-500" : "border-red-500"}>
        <CardHeader className={beatMarket ? "bg-green-50" : "bg-red-50"}>
          <CardTitle className="flex items-center">
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
          </CardTitle>
          <CardDescription>
            {beatMarket
              ? `Your portfolio outperformed VTI by ${formatPercentage(outperformance)}`
              : `Your portfolio underperformed VTI by ${formatPercentage(Math.abs(outperformance))}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500">
              Analysis period: {years.toFixed(1)} years ({formatPercentage(annualizedPortfolioReturn)} vs{" "}
              {formatPercentage(annualizedVtiReturn)} annualized)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>What this means for your investment strategy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {beatMarket ? (
              <>
                <p>
                  Congratulations! Your active trading strategy outperformed a simple buy-and-hold approach with VTI by{" "}
                  {formatPercentage(outperformance)} (
                  {formatPercentage(annualizedPortfolioReturn - annualizedVtiReturn)} annualized). This suggests your
                  investment decisions have added value compared to a passive index strategy.
                </p>
                <p>
                  Keep in mind that past performance doesn't guarantee future results, and it's important to consider
                  factors like risk-adjusted returns, time spent managing investments, and tax implications when
                  evaluating your strategy.
                </p>
              </>
            ) : (
              <>
                <p>
                  Your portfolio underperformed a simple buy-and-hold approach with VTI by{" "}
                  {formatPercentage(Math.abs(outperformance))}(
                  {formatPercentage(Math.abs(annualizedPortfolioReturn - annualizedVtiReturn))} annualized). This is
                  actually quite common - studies show that the majority of active traders underperform the market over
                  time.
                </p>
                <p>
                  Consider whether the time and effort spent on active trading is worth the results, or if a more
                  passive index-based approach might better suit your investment goals. Remember that even professional
                  fund managers often struggle to consistently beat market indices.
                </p>
              </>
            )}
            <p>For a more comprehensive analysis, consider factors like:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Risk-adjusted returns (Sharpe ratio, volatility)</li>
              <li>Trading costs and tax implications</li>
              <li>Time spent managing your portfolio</li>
              <li>Consistency of returns over different market conditions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

