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
  date: Date
  portfolioValue: number
  vtiSharesHeld: number
  vtiPurchase?: {
    shares: number
    price: number
  }
}

// Portfolio data structure
export interface PortfolioData {
  timeline: TimelinePoint[]
  transactions: RobinhoodTransaction[]
  totalInvested: number
}

// Comparison result
export interface ComparisonResult {
  totalInvested: number
  endValue: number
  vtiEndValue: number
  portfolioReturn: number
  vtiReturn: number
  annualizedPortfolioReturn: number
  annualizedVtiReturn: number
  outperformance: number
  beatMarket: boolean
  years: number
}

