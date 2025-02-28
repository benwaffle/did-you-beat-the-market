import { calculateComparison } from "../src/lib/data-processor"

// Sample test data
const sampleTransactions = [
  {
    activityDate: new Date("2023-01-01"),
    processDate: new Date("2023-01-01"),
    settleDate: new Date("2023-01-01"),
    instrument: "",
    description: "ACH Deposit",
    transCode: "ACH",
    quantity: null,
    price: null,
    amount: 10000,
  },
  {
    activityDate: new Date("2023-06-01"),
    processDate: new Date("2023-06-01"),
    settleDate: new Date("2023-06-01"),
    instrument: "",
    description: "ACH Deposit",
    transCode: "ACH",
    quantity: null,
    price: null,
    amount: 5000,
  },
]

const sampleVtiPrices = [
  {
    date: new Date("2023-01-01"),
    price: 100,
    open: 100,
    high: 101,
    low: 99,
    volume: "1M",
    changePercent: "0%",
  },
  {
    date: new Date("2023-06-01"),
    price: 110,
    open: 109,
    high: 111,
    low: 108,
    volume: "1M",
    changePercent: "10%",
  },
  {
    date: new Date("2023-12-31"),
    price: 120,
    open: 119,
    high: 121,
    low: 118,
    volume: "1M",
    changePercent: "20%",
  },
]

// Test total invested calculation
console.log("Testing total invested calculation...")
const result = calculateComparison(sampleTransactions, sampleVtiPrices, 18000)
console.log(`Total invested: ${result.totalInvested}`)
console.assert(result.totalInvested === 15000, "Total invested should be $15,000")

// Test VTI share calculation
console.log("\nTesting VTI share calculation...")
const firstPoint = result.timeline[0]
console.log(`Initial VTI shares: ${firstPoint.vtiShares}`)
console.assert(firstPoint.vtiShares === 100, "Initial VTI shares should be 100 ($10,000 / $100)")

const secondPoint = result.timeline[1]
console.log(`VTI shares after second deposit: ${secondPoint.vtiShares}`)
console.assert(secondPoint.vtiShares === 145.45, "VTI shares should be 145.45 (100 + $5,000/$110)")

// Test VTI value calculation
console.log("\nTesting VTI value calculation...")
const finalPoint = result.timeline[result.timeline.length - 1]
console.log(`Final VTI value: ${finalPoint.vtiValue}`)
const expectedFinalValue = 145.45 * 120
console.assert(
  Math.abs(finalPoint.vtiValue - expectedFinalValue) < 0.01,
  `Final VTI value should be ${expectedFinalValue}`,
)

// Test annualized return calculation
console.log("\nTesting annualized return calculation...")
const years = 1 // Sample data spans 1 year
const vtiReturn = ((finalPoint.vtiValue - result.totalInvested) / result.totalInvested) * 100
const annualizedVtiReturn = (Math.pow(finalPoint.vtiValue / result.totalInvested, 1 / years) - 1) * 100
console.log(`VTI total return: ${vtiReturn.toFixed(2)}%`)
console.log(`VTI annualized return: ${annualizedVtiReturn.toFixed(2)}%`)

console.log("\nAll tests completed!")

