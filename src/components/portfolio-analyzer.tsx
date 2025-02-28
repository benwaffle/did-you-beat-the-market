"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, Upload, AlertCircle } from "lucide-react"
import Papa from "papaparse"
import PerformanceChart from "@/components/performance-chart"
import SummaryStats from "@/components/summary-stats"
import { processRobinhoodData, processVtiData, calculateComparison } from "@/lib/data-processor"
import type { RobinhoodTransaction, VtiPrice, PortfolioData, ComparisonResult } from "@/lib/types"

export default function PortfolioAnalyzer() {
  const [robinhoodFile, setRobinhoodFile] = useState<File | null>(null)
  const [robinhoodData, setRobinhoodData] = useState<RobinhoodTransaction[]>([])
  const [vtiData, setVtiData] = useState<VtiPrice[]>([])
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null)
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load VTI data on component mount
  useEffect(() => {
    const loadVtiData = async () => {
      try {
        const response = await fetch("/vti.csv");
        const text = await response.text()

        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const processedData = processVtiData(results.data as any[])
            setVtiData(processedData)
          },
          error: (error) => {
            setError(`Error parsing VTI data: ${error.message}`)
          },
        })
      } catch (err) {
        setError(`Error loading VTI data: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    loadVtiData()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setRobinhoodFile(file)
      setError(null)
    }
  }

  const handleAnalyze = () => {
    if (!robinhoodFile) {
      setError("Please upload a Robinhood transaction file")
      return
    }

    if (vtiData.length === 0) {
      setError("VTI data is not loaded yet. Please try again in a moment.")
      return
    }

    setIsLoading(true)
    setError(null)

    Papa.parse(robinhoodFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.data.length === 0) {
            throw new Error("No data found in the uploaded file")
          }

          const processedRobinhoodData = processRobinhoodData(results.data as any[])

          if (processedRobinhoodData.length === 0) {
            throw new Error("No valid transactions found in the uploaded file")
          }

          setRobinhoodData(processedRobinhoodData)

          const portfolioData = calculateComparison(processedRobinhoodData, vtiData)

          if (portfolioData.timeline.length === 0) {
            throw new Error("Could not generate timeline data. Please check your transaction history.")
          }

          setPortfolioData(portfolioData)

          // Calculate summary statistics
          const startDate = portfolioData.timeline[0].date
          const endDate = portfolioData.timeline[portfolioData.timeline.length - 1].date
          const startValue = portfolioData.timeline[0].portfolioValue
          const endValue = portfolioData.timeline[portfolioData.timeline.length - 1].portfolioValue
          const vtiStartValue = portfolioData.timeline[0].vtiValue
          const vtiEndValue = portfolioData.timeline[portfolioData.timeline.length - 1].vtiValue

          const portfolioReturn = startValue !== 0 ? ((endValue - startValue) / startValue) * 100 : 0
          const vtiReturn = vtiStartValue !== 0 ? ((vtiEndValue - vtiStartValue) / vtiStartValue) * 100 : 0
          const outperformance = portfolioReturn - vtiReturn

          setComparisonResult({
            startDate,
            endDate,
            startValue,
            endValue,
            vtiStartValue,
            vtiEndValue,
            portfolioReturn,
            vtiReturn,
            outperformance,
            beatMarket: portfolioReturn > vtiReturn,
          })

          setIsLoading(false)
        } catch (err) {
          console.error(err)
          setError(`Error processing data: ${err instanceof Error ? err.message : String(err)}`)
          setIsLoading(false)
        }
      },
      error: (error) => {
        setError(`Error parsing Robinhood data: ${error.message}`)
        setIsLoading(false)
      },
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Your Robinhood Transaction History</CardTitle>
          <CardDescription>Compare your trading performance to a simple VTI buy-and-hold strategy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">How to get your Robinhood transaction history:</h3>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>Log in to your Robinhood account</li>
                <li>Go to Account → Statements & History → Account Statements</li>
                <li>
                  <a
                    href="https://robinhood.com/account/reports-statements/activity-reports"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    Visit Robinhood Activity Reports <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </li>
                <li>Select "Account Summary" and choose your date range</li>
                <li>Download the CSV file</li>
              </ol>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
              <div className="mb-4">
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
              <div className="flex items-center justify-center">
                <label className="flex flex-col items-center space-y-2 cursor-pointer">
                  <span className="text-sm font-medium text-gray-700">
                    {robinhoodFile ? robinhoodFile.name : "Upload Robinhood CSV"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {robinhoodFile ? `${(robinhoodFile.size / 1024).toFixed(2)} KB` : "CSV file only"}
                  </span>
                  <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                  <Button variant="outline" type="button" className="mt-2">
                    {robinhoodFile ? "Change File" : "Select File"}
                  </Button>
                </label>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleAnalyze} disabled={!robinhoodFile || isLoading} className="w-full">
              {isLoading ? "Analyzing..." : "Analyze Performance"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {portfolioData && comparisonResult && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chart">Performance Chart</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <SummaryStats comparisonResult={comparisonResult} />
          </TabsContent>

          <TabsContent value="chart">
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>Your portfolio vs. VTI buy-and-hold strategy</CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceChart data={portfolioData.timeline} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

