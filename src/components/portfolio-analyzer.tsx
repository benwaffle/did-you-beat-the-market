"use client"

import type React from "react"

import PerformanceChart from "@/components/performance-chart"
import SummaryStats from "@/components/summary-stats"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { calculateComparison, processRobinhoodData, processVtiData } from "@/lib/data-processor"
import type { ComparisonResult, PortfolioData, VtiPrice } from "@/lib/types"
import { AlertCircle, DollarSign, ExternalLink, Upload } from "lucide-react"
import Papa from "papaparse"
import { useEffect, useRef, useState } from "react"

export default function PortfolioAnalyzer() {
  const [robinhoodFile, setRobinhoodFile] = useState<File | null>(null)
  const [currentValue, setCurrentValue] = useState<string>("")
  const [vtiData, setVtiData] = useState<VtiPrice[]>([])
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null)
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load VTI data on component mount
  useEffect(() => {
    const loadVtiData = async () => {
      try {
        const response = await fetch("/vti.csv")
        const text = await response.text()

        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const processedData = processVtiData(results.data as any[])
            setVtiData(processedData)
          },
          error: (error: Error) => {
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

  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleAnalyze = () => {
    if (!robinhoodFile) {
      setError("Please upload a Robinhood transaction file")
      return
    }

    if (!currentValue || isNaN(Number.parseFloat(currentValue))) {
      setError("Please enter your current portfolio value")
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

          const portfolioData = calculateComparison(processedRobinhoodData, vtiData)

          if (portfolioData.timeline.length === 0) {
            throw new Error("Could not generate timeline data. Please check your transaction history.")
          }

          setPortfolioData(portfolioData)

          // Calculate summary statistics
          const totalInvested = portfolioData.totalInvested
          const endValue = Number.parseFloat(currentValue)
          
          // Calculate VTI end value based on final VTI shares and the latest VTI price
          const finalVtiShares = portfolioData.timeline[portfolioData.timeline.length - 1].vtiShares
          const latestVtiPrice = vtiData[vtiData.length - 1].price
          const vtiEndValue = finalVtiShares * latestVtiPrice

          console.log("Final VTI calculation:", {
            finalVtiShares,
            latestVtiPrice,
            vtiEndValue
          })

          // Calculate years between first and last transaction
          const startDate = new Date(portfolioData.timeline[0].date)
          const endDate = new Date(portfolioData.timeline[portfolioData.timeline.length - 1].date)
          const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

          // Calculate annualized returns
          const portfolioReturn = ((endValue - totalInvested) / totalInvested) * 100
          const vtiReturn = ((vtiEndValue - totalInvested) / totalInvested) * 100
          const annualizedPortfolioReturn = (Math.pow(endValue / totalInvested, 1 / years) - 1) * 100
          const annualizedVtiReturn = (Math.pow(vtiEndValue / totalInvested, 1 / years) - 1) * 100
          const outperformance = portfolioReturn - vtiReturn

          setComparisonResult({
            totalInvested,
            endValue,
            vtiEndValue,
            portfolioReturn,
            vtiReturn,
            annualizedPortfolioReturn,
            annualizedVtiReturn,
            outperformance,
            beatMarket: portfolioReturn > vtiReturn,
            years,
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
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Upload Your Data</CardTitle>
            <CardDescription>
              Upload your Robinhood transaction history and enter your current portfolio value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                <div className="mb-4">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex items-center justify-center">
                  <label className="flex flex-col items-center space-y-2">
                    <span className="text-sm font-medium text-gray-700">
                      {robinhoodFile ? robinhoodFile.name : "Upload Robinhood CSV"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {robinhoodFile ? `${(robinhoodFile.size / 1024).toFixed(2)} KB` : "CSV file only"}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".csv"
                      onChange={handleFileChange}
                    />
                    <Button variant="outline" type="button" onClick={handleFileButtonClick} className="mt-2">
                      {robinhoodFile ? "Change File" : "Select File"}
                    </Button>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentValue">Current Portfolio Value</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    id="currentValue"
                    type="number"
                    placeholder="Enter your current portfolio value"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter the current total value of your Robinhood portfolio
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={!robinhoodFile || !currentValue || isLoading}
                className="w-full"
              >
                {isLoading ? "Analyzing..." : "Analyze Performance"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {portfolioData && comparisonResult && (
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-4 mb-6 lg:mb-0">
            <h2 className="text-xl font-semibold mb-4">Performance Summary</h2>
            <SummaryStats comparisonResult={comparisonResult} />
          </div>

          <div className="lg:col-span-8">
            <h2 className="text-xl font-semibold mb-4">VTI Buy & Hold Performance</h2>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <PerformanceChart 
                data={portfolioData.timeline} 
                vtiPrices={vtiData}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

