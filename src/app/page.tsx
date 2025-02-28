import PortfolioAnalyzer from "@/components/portfolio-analyzer";
import { Github } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Did You Beat the Market? - Robinhood Portfolio Analyzer",
  description: "Compare your Robinhood portfolio performance to a total stock market index fund strategy",
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Did You Beat the Market?
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Compare your Robinhood portfolio performance to a total stock market
            index fund strategy
          </p>
          <div className="absolute top-4 right-4">
            <a
              href="https://github.com/benwaffle/did-you-beat-the-market"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <Github className="h-4 w-4 mr-1" /> Source Code
            </a>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <PortfolioAnalyzer />
      </main>
      <footer className="bg-white mt-12 py-6 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs text-gray-500">
            Disclaimer: This tool is for informational purposes only and does
            not constitute investment advice. Past performance is not indicative
            of future results. The analysis provided is based on the data you
            upload and should not be the sole basis for investment decisions.
            Always consult with a qualified financial advisor before making
            investment decisions.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            All data is processed entirely in your browser and is never sent to
            any server. Your privacy is important to us.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This tool is not affiliated with, endorsed by, or sponsored by
            Robinhood Markets, Inc. or The Vanguard Group, Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}

