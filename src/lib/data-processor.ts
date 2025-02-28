import type { RobinhoodTransaction, VtiPrice, PortfolioData, TimelinePoint } from "./types"

interface PortfolioState {
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
    .reverse() // Reverse the order to process from oldest to newest
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

// Calculate portfolio value and VTI comparison
export function calculateComparison(
  transactions: RobinhoodTransaction[],
  vtiPrices: VtiPrice[],
): PortfolioData {
  if (transactions.length === 0) {
    throw new Error("No transactions found in the uploaded file")
  }

  console.log(`Processing ${transactions.length} transactions`)
  console.log(`First transaction: ${transactions[0].activityDate}`)
  console.log(`Last transaction: ${transactions[transactions.length - 1].activityDate}`)

  // Initialize portfolio state
  const portfolioState: PortfolioState = {
    totalInvested: 0,
  }

  const timeline: TimelinePoint[] = []
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
      case "Sell":
      case "STC":
        break

      case "ACH":
        if (transaction.amount > 0) {
          portfolioState.totalInvested += transaction.amount
          
          // Only update VTI shares for ACH deposits (cash inflows)
          if (vtiPrices.length > 0) {
            // Find the exact VTI price for this date
            const transactionDate = transaction.activityDate.toISOString().split('T')[0];
            const exactVtiPrice = vtiPrices.find(price => 
              price.date.toISOString().split('T')[0] === transactionDate
            );
            
            if (!exactVtiPrice) {
              throw new Error(`No VTI price available for date: ${transactionDate}. Cannot calculate VTI shares.`);
            }
            
            if (timeline.length === 0) {
              // First transaction - initialize VTI position - maintain full precision
              vtiShares = transaction.amount / exactVtiPrice.price;
            } else {
              // Add new shares based on the deposit amount
              vtiShares += transaction.amount / exactVtiPrice.price;
            }
          }
        }
        break

      // Cash-related transactions
      case "INT":  // Interest
      case "CDIV": // Cash Dividend
      case "REC":  // Receive/Receipt
        break

      // Fee-related transactions
      case "AFEE": // Account Fee
      case "DFEE": // Dividend Fee
        break
        
      // Transactions that don't affect our investment tracking
      case "BCXL": // Buy Cancel
      case "SCXL": // Sell Cancel
      case "SOFF": // Settlement Offset
      case "SPL":  // Stock Split
      case "SPR":  // Stock Split Reversal
      case "SXCH": // Stock Exchange
      case "T/A":  // Transfer/Adjustment
      case "MRGC": // Margin Call
      case "MRGS": // Margin Sell
      case "OCA":  // Option Assignment
      case "OEXP": // Option Expiration
      case "SLIP": // Price Improvement
      case "FUTSWP": // Future Swap
      case "DTAX":   // Dividend Tax
        console.log(`Ignoring transaction type: ${transaction.transCode} with amount: ${transaction.amount}`)
        break

      default:
        console.warn(`Unknown transaction type: ${transaction.transCode} with amount: ${transaction.amount}`)
    }

    // Add timeline point - only track date and VTI shares
    timeline.push({
      date: dateStr,
      vtiShares,
    })

    console.log("Timeline point added:", {
      date: dateStr,
      vtiShares,
      totalInvested: portfolioState.totalInvested,
    })
  }

  // Log final state
  console.log("Final portfolio state:", {
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

