import type { RobinhoodTransaction, VtiPrice, PortfolioData, TimelinePoint } from "./types"
import { addDays, eachDayOfInterval, isSameDay } from "date-fns"

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

export function processVtiData(data: any[]): VtiPrice[] {
  return data
    .filter((row) => row["Date"] && row["Price"]) // Filter out invalid rows
    .map((row) => {
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
    .reverse()
}

export function findVtiPriceForDate(date: Date, vtiPrices: VtiPrice[]): VtiPrice | null {
  return vtiPrices.find((price) => isSameDay(price.date, date)) ?? null;
}

type SimulationTransaction = {
  date: Date;
  cash: number;
};

export function calculateComparison(
  transactions: RobinhoodTransaction[],
  vtiPrices: VtiPrice[],
): PortfolioData {
  console.log(`Processing ${transactions.length} transactions`)

  let totalInvested = 0;
  const simulation: SimulationTransaction[] = [];

  console.groupCollapsed("Processing transactions");

  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i]

    console.log(
      `Processing transaction ${i + 1}/${transactions.length}:`,
      transaction
    );

    if (transaction.transCode === "ACH" && transaction.description === "ACH Deposit") {
      totalInvested += transaction.amount
      
      simulation.push({
        date: transaction.activityDate,
        cash: transaction.amount,
      })

      console.log(`VTI Purchase: Added ${transaction.amount} on ${transaction.activityDate}`);
    } else if (transaction.transCode === "ACH" && transaction.description === "ACH CANCEL") {
      // TODO
      console.warn('Skipping ACH CANCEL', transaction)
    } else {
      console.warn('Skipping transaction', transaction)
    }
    // TODO: withdrawals
  }

  console.groupEnd();

  console.log("Total invested", totalInvested)
  console.log("ACH Deposits aka VTI purchases", simulation)

  const continuousTimeline = createContinuousTimeline(simulation, vtiPrices);

  console.log("Continuous timeline", continuousTimeline)
  
  return {
    timeline: continuousTimeline,
    transactions,
    totalInvested,
  }
}

// Create a continuous timeline with one point per day
export function createContinuousTimeline(
  simulation: SimulationTransaction[], 
  vtiPrices: VtiPrice[],
): TimelinePoint[] {
  const startDate = new Date(simulation[0].date);
  const endDate = new Date();
  
  console.log("Creating continuous timeline from", startDate, "to", endDate);
  
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  let result: TimelinePoint[] = [];
  let vtiSharesOwned = 0;

  for (const today of allDays) {
    const dollarsInvestedToday = simulation
      .filter((t) => isSameDay(t.date, today))
      .reduce((acc, t) => {
        return acc + t.cash;
      }, 0);

    const todaysVTIPrice = findVtiPriceForDate(today, vtiPrices)?.price;
    if (!todaysVTIPrice) { // weekends, holidays, etc...
      if (dollarsInvestedToday > 0) {
        console.log('No VTI price found for', today, 'pretending the money was deposited the next day')
        // pretend the money was deposited the next day. this should push purchases to open market days
        for (let i = 0; i < simulation.length; i++) {
          if (isSameDay(simulation[i].date, today)) {
            simulation[i].date = addDays(simulation[i].date, 1);
          }
        }
      }

      continue;
    }

    vtiSharesOwned += dollarsInvestedToday / todaysVTIPrice;

    result.push({
      date: today,
      portfolioValue: vtiSharesOwned * todaysVTIPrice,
      vtiSharesHeld: vtiSharesOwned,
      vtiPurchase:
        dollarsInvestedToday > 0
          ? {
              shares: dollarsInvestedToday / todaysVTIPrice,
              price: todaysVTIPrice,
            }
          : undefined,
    });
  }

  return result;
}

