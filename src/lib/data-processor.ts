import type { RobinhoodTransaction, VtiPrice, PortfolioData, TimelinePoint } from "./types"

interface SecurityHolding {
  shares: number
  avgPrice: number
}

interface PortfolioState {
  cash: number
  securities: Map<string, SecurityHolding>
  totalInvested: number
}

// Process Robinhood transaction data
export function processRobinhoodData(data: any[]): RobinhoodTransaction[] {
  return data
    .filter((row) => row["Activity Date"] && row["Trans Code"]) // Filter out invalid rows
    .map((row) => {
      // Parse price from string (remove $ and commas)
      let price = null
      if (row["Price"]) {
        const priceStr = row["Price"].replace(/[$,]/g, "")
        if (!isNaN(Number.parseFloat(priceStr))) {
          price = Number.parseFloat(priceStr)
        }
      }

      // Parse amount from string (remove $ and commas)
      let amount = 0
      if (row["Amount"]) {
        // Remove parentheses for negative numbers and $ sign
        const amountStr = row["Amount"].replace(/[$,()]/g, "")
        if (!isNaN(Number.parseFloat(amountStr))) {
          amount = Number.parseFloat(amountStr)

          // If the original string had parentheses, it's negative
          if (row["Amount"].includes("(") && row["Amount"].includes(")")) {
            amount = -amount
          }
        }
      }

      // Parse quantity
      let quantity = null
      if (row["Quantity"]) {
        const quantityStr = row["Quantity"].replace(/,/g, "")
        if (!isNaN(Number.parseFloat(quantityStr))) {
          quantity = Number.parseFloat(quantityStr)
        }
      }

      return {
        activityDate: new Date(row["Activity Date"]),
        processDate: new Date(row["Process Date"]),
        settleDate: new Date(row["Settle Date"]),
        instrument: row["Instrument"] || "",
        description: row["Description"] || "",
        transCode: row["Trans Code"] || "",
        quantity,
        price,
        amount,
      }
    })
    .filter((transaction) => {
      // Keep all transactions with non-zero amounts
      return transaction.amount !== 0
    })
    .sort((a, b) => a.activityDate.getTime() - b.activityDate.getTime()) // Sort by activity date
}

// Process VTI price data
export function processVtiData(data: any[]): VtiPrice[] {
  return data
    .filter((row) => row["Date"] && row["Price"]) // Filter out invalid rows
    .map((row) => {
      // Parse price from string (remove $ and commas)
      const price = Number.parseFloat(row["Price"].replace(/[$,]/g, ""))
      const open = Number.parseFloat(row["Open"].replace(/[$,]/g, ""))
      const high = Number.parseFloat(row["High"].toString().replace(/[$,]/g, ""))
      const low = Number.parseFloat(row["Low"].replace(/[$,]/g, ""))

      return {
        date: new Date(row["Date"]),
        price,
        open,
        high,
        low,
        volume: row["Vol."],
        changePercent: row["Change %"],
      }
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime()) // Sort by date
}

function calculatePortfolioValue(state: PortfolioState, latestPrices: Map<string, number>): number {
  let totalValue = state.cash

  // Add value of all securities
  for (const [symbol, holding] of state.securities.entries()) {
    const currentPrice = latestPrices.get(symbol) || holding.avgPrice
    totalValue += holding.shares * currentPrice
  }

  return totalValue
}

// Calculate portfolio value and VTI comparison
export function calculateComparison(
  transactions: RobinhoodTransaction[],
  vtiPrices: VtiPrice[],
  currentValue: number,
): PortfolioData {
  if (transactions.length === 0) {
    throw new Error("No transactions found in the uploaded file")
  }

  console.log(`Processing ${transactions.length} transactions`)
  console.log(`First transaction: ${transactions[0].activityDate}`)
  console.log(`Last transaction: ${transactions[transactions.length - 1].activityDate}`)

  // Initialize portfolio state
  const portfolioState: PortfolioState = {
    cash: 0,
    securities: new Map(),
    totalInvested: 0,
  }

  const timeline: TimelinePoint[] = []
  const latestPrices = new Map<string, number>()
  let vtiShares = 0

  // Process transactions chronologically and create timeline points
  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i]
    const dateStr = transaction.activityDate.toISOString().split("T")[0]

    console.log(`Processing transaction ${i + 1}/${transactions.length}:`, {
      date: dateStr,
      type: transaction.transCode,
      instrument: transaction.instrument,
      amount: transaction.amount,
    })

    // Update portfolio state based on transaction type
    switch (transaction.transCode) {
      case "Buy":
      case "BTO":
        if (transaction.quantity && transaction.price) {
          const holding = portfolioState.securities.get(transaction.instrument) || { shares: 0, avgPrice: 0 }
          const newShares = holding.shares + transaction.quantity
          const newAvgPrice = (holding.shares * holding.avgPrice + transaction.quantity * transaction.price) / newShares
          portfolioState.securities.set(transaction.instrument, {
            shares: newShares,
            avgPrice: newAvgPrice,
          })
          latestPrices.set(transaction.instrument, transaction.price)
          portfolioState.cash -= Math.abs(transaction.amount)
          // Removed: portfolioState.totalInvested += Math.abs(transaction.amount)
        }
        break

      case "Sell":
      case "STC":
        if (transaction.quantity) {
          const holding = portfolioState.securities.get(transaction.instrument)
          if (holding) {
            const newShares = holding.shares - transaction.quantity
            portfolioState.securities.set(transaction.instrument, {
              shares: newShares,
              avgPrice: holding.avgPrice,
            })
          }
          if (transaction.price) {
            latestPrices.set(transaction.instrument, transaction.price)
          }
          portfolioState.cash += Math.abs(transaction.amount)
        }
        break

      case "ACH":
        portfolioState.cash += transaction.amount
        if (transaction.amount > 0) {
          portfolioState.totalInvested += transaction.amount
        }
        break

      default:
        portfolioState.cash += transaction.amount
        if (transaction.amount > 0) {
          portfolioState.totalInvested += transaction.amount
        }
    }

    // Calculate intermediate portfolio value for historical tracking
    const portfolioValue = calculatePortfolioValue(portfolioState, latestPrices)

    // Find closest VTI price (if available)
    let vtiValue = portfolioValue // Default to portfolio value if no VTI price available
    if (vtiPrices.length > 0) {
      const closestVtiPrice = vtiPrices.reduce((closest, current) => {
        const currentDiff = Math.abs(current.date.getTime() - transaction.activityDate.getTime())
        const closestDiff = Math.abs(closest.date.getTime() - transaction.activityDate.getTime())
        return currentDiff < closestDiff ? current : closest
      }, vtiPrices[0])

      if (timeline.length === 0) {
        // First transaction - initialize VTI position
        vtiShares = portfolioValue / closestVtiPrice.price
      } else {
        // Calculate cash flow and adjust VTI shares
        const lastPoint = timeline[timeline.length - 1]
        const cashFlow = portfolioValue - lastPoint.portfolioValue
        if (cashFlow !== 0) {
          vtiShares += cashFlow / closestVtiPrice.price
        }
      }
      vtiValue = vtiShares * closestVtiPrice.price
    }

    // Add timeline point
    timeline.push({
      date: dateStr,
      portfolioValue: i === transactions.length - 1 ? currentValue : portfolioValue, // Use current value for last point
      vtiValue,
      portfolioCashFlow: portfolioState.cash,
      vtiShares,
    })

    console.log("Timeline point added:", {
      date: dateStr,
      portfolioValue: i === transactions.length - 1 ? currentValue : portfolioValue,
      vtiValue,
      cash: portfolioState.cash,
      totalInvested: portfolioState.totalInvested,
    })
  }

  // Log final state
  console.log("Final portfolio state:", {
    cash: portfolioState.cash,
    securitiesCount: portfolioState.securities.size,
    timelinePoints: timeline.length,
    totalInvested: portfolioState.totalInvested,
  })

  if (timeline.length === 0) {
    throw new Error("No timeline points were generated. This should never happen as we process every transaction.")
  }

  return {
    timeline,
    transactions,
    totalInvested: portfolioState.totalInvested,
  }
}

