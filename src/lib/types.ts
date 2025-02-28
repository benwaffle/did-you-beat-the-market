export interface RobinhoodTransaction {
  activityDate: Date
  processDate: Date
  settleDate: Date
  instrument: string
  description: string
  transCode: string
  quantity: number | null
  price: number | null
  amount: number
}

// VTI price data
export interface VtiPrice {
  date: Date
  price: number
  open: number
  high: number
  low: number
  volume: string
  changePercent: string
}

// Timeline point for comparison
export interface TimelinePoint {
  date: string
  portfolioValue: number
  vtiValue: number
  portfolioCashFlow: number
  vtiShares: number
}

// Portfolio data structure
export interface PortfolioData {
  timeline: TimelinePoint[]
  transactions: RobinhoodTransaction[]
}

// Comparison result
export interface ComparisonResult {
  startDate: string
  endDate: string
  startValue: number
  endValue: number
  vtiStartValue: number
  vtiEndValue: number
  portfolioReturn: number
  vtiReturn: number
  outperformance: number
  beatMarket: boolean
}

