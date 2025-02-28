import assert from "assert"
import { calculateComparison } from "../src/lib/data-processor"

// Custom assertion function that exits with error code 1 on failure
function assertWithExit(condition: boolean, message: string): void {
  try {
    assert(condition, message)
  } catch (error) {
    console.error(`Assertion failed: ${message}`)
    process.exit(1)
  }
}

function fpEq(a: number, b: number, epsilon: number = 0.01): boolean {
  return Math.abs(a - b) < epsilon;
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

// Find the first point with VTI shares (should be the first deposit)
const firstDepositPoint = result.timeline[0];
console.log('First deposit point', firstDepositPoint)
assertWithExit(
  firstDepositPoint.vtiPurchase !== undefined,
  "First deposit point should have a vtiPurchase"
);

assertWithExit(
  fpEq(firstDepositPoint.vtiPurchase!.shares, 100),
  `Initial VTI shares should be 100 ($10,000 / $100), got ${firstDepositPoint.vtiPurchase!.shares}`
)

// Calculate final VTI value based on shares and latest price
console.log("\nTesting VTI value calculation...")
const finalPoint = result.timeline[result.timeline.length - 1];
const finalVtiValue = finalPoint.portfolioValue
console.log(`Final VTI value: ${finalVtiValue}`)

// Use the exact calculation for expected value
const expectedFinalValue = 17454.55
assertWithExit(
  fpEq(finalVtiValue, expectedFinalValue),
  `Final VTI value should be ${expectedFinalValue}, got ${finalVtiValue}`
)

console.log("\nAll tests completed!")