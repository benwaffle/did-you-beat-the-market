import { calculateComparison } from "../src/lib/data-processor"
import assert from "assert"

// Custom assertion function that exits with error code 1 on failure
function assertWithExit(condition: boolean, message: string): void {
  try {
    assert(condition, message)
  } catch (error) {
    console.error(`Assertion failed: ${message}`)
    process.exit(1)
  }
}

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
const result = calculateComparison(sampleTransactions, sampleVtiPrices)
console.log(`Total invested: ${result.totalInvested}`)
assertWithExit(result.totalInvested === 15000, "Total invested should be $15,000")

// Test VTI share calculation
console.log("\nTesting VTI share calculation...")
const firstPoint = result.timeline[0]
console.log(`Initial VTI shares: ${firstPoint.vtiShares}`)

// Use epsilon comparison for floating point
const EPSILON = 0.01; // Small tolerance for floating point comparison
assertWithExit(
  Math.abs(firstPoint.vtiShares - 100) < EPSILON,
  `Initial VTI shares should be 100 ($10,000 / $100), got ${firstPoint.vtiShares}`
)

const secondPoint = result.timeline[1]
console.log(`VTI shares after second deposit: ${secondPoint.vtiShares}`)
assertWithExit(
  Math.abs(secondPoint.vtiShares - 145.45) < EPSILON,
  `VTI shares should be approximately 145.45 (100 + $5,000/$110), got ${secondPoint.vtiShares}`
)

// Calculate final VTI value based on shares and latest price
console.log("\nTesting VTI value calculation...")
const finalPoint = result.timeline[result.timeline.length - 1]
const finalVtiShares = finalPoint.vtiShares
const latestVtiPrice = sampleVtiPrices[sampleVtiPrices.length - 1].price
const finalVtiValue = finalVtiShares * latestVtiPrice
console.log(`Final VTI shares: ${finalVtiShares}`)
console.log(`Latest VTI price: ${latestVtiPrice}`)
console.log(`Final VTI value: ${finalVtiValue}`)

// Use the exact calculation for expected value
const expectedFinalValue = 17454.55
assertWithExit(
  Math.abs(finalVtiValue - expectedFinalValue) < EPSILON,
  `Final VTI value should be approximately ${expectedFinalValue}, got ${finalVtiValue}`
)

// Test annualized return calculation
console.log("\nTesting annualized return calculation...")
const years = 1 // Sample data spans 1 year
const vtiReturn = ((finalVtiValue - result.totalInvested) / result.totalInvested) * 100
const annualizedVtiReturn = (Math.pow(finalVtiValue / result.totalInvested, 1 / years) - 1) * 100
console.log(`VTI total return: ${vtiReturn.toFixed(2)}%`)
console.log(`VTI annualized return: ${annualizedVtiReturn.toFixed(2)}%`)

console.log("\nAll tests completed!")

