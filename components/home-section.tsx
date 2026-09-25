"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Brain, BarChart3, Zap, TrendingUp, Database } from "lucide-react"

interface HomeSectionProps {
  onGetStarted: () => void
  datasetType?: "renewable" | "solar"
}

export default function HomeSection({ onGetStarted, datasetType = "renewable" }: HomeSectionProps) {
  const isSolar = datasetType === "solar"

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-background to-background" />
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>Advanced Predictive Analytics</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance">
              {isSolar ? (
                <>
                  Solar Power Plant <span className="text-emerald-400">Analytics</span>
                </>
              ) : (
                <>
                  Renewable Energy <span className="text-emerald-400">Forecasting</span>
                </>
              )}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground text-balance max-w-2xl mx-auto">
              {isSolar
                ? "Monitor and predict solar power plant performance across multiple inverters. Analyze DC/AC power, daily yield, and optimize your solar energy operations with machine learning."
                : "Harness the power of machine learning to predict solar panel performance, optimize energy yield, and make data-driven decisions for your renewable energy projects."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg px-8 py-6"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to analyze and forecast renewable energy performance
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-border bg-card hover:border-emerald-500/50 transition-colors">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-semibold">Easy Data Upload</h3>
              <p className="text-muted-foreground">
                Simply drag and drop your CSV or Excel files. Support for multiple data formats with instant validation.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:border-emerald-500/50 transition-colors">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Brain className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-semibold">Advanced ML Models</h3>
              <p className="text-muted-foreground">
                Choose from PCA, Random Forest, and RNN models. Each optimized for different prediction scenarios.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:border-emerald-500/50 transition-colors">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-semibold">Dynamic Dashboards</h3>
              <p className="text-muted-foreground">
                Interactive visualizations with multiple chart types. Real-time updates as you explore different models.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Get insights in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/50">
                <Database className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="text-6xl font-bold text-emerald-500/20">01</div>
              <h3 className="text-2xl font-semibold">Upload Data</h3>
              <p className="text-muted-foreground">Upload your solar energy data in CSV or Excel format</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/50">
                <TrendingUp className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="text-6xl font-bold text-emerald-500/20">02</div>
              <h3 className="text-2xl font-semibold">Process & Analyze</h3>
              <p className="text-muted-foreground">Our ML models analyze patterns and generate predictions</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/50">
                <BarChart3 className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="text-6xl font-bold text-emerald-500/20">03</div>
              <h3 className="text-2xl font-semibold">Visualize Results</h3>
              <p className="text-muted-foreground">Explore interactive charts and key performance metrics</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
