"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Zap, TrendingUp, Activity, Sun } from "lucide-react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController,
  ScatterController,
} from "chart.js"
import type { ModelType, ChartType, SolarParsedData } from "@/app/page"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController,
  ScatterController,
)

interface SolarDashboardSectionProps {
  data: SolarParsedData
  selectedModel: ModelType
  selectedChartType: ChartType
  onModelChange: (model: ModelType) => void
  onChartTypeChange: (chartType: ChartType) => void
  onUploadNew: () => void
}

export default function SolarDashboardSection({
  data,
  selectedModel,
  selectedChartType,
  onModelChange,
  onChartTypeChange,
  onUploadNew,
}: SolarDashboardSectionProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<ChartJS | null>(null)
  const dcPowerChartRef = useRef<HTMLCanvasElement>(null)
  const dcPowerChartInstance = useRef<ChartJS | null>(null)
  const acPowerChartRef = useRef<HTMLCanvasElement>(null)
  const acPowerChartInstance = useRef<ChartJS | null>(null)
  const dailyYieldChartRef = useRef<HTMLCanvasElement>(null)
  const dailyYieldChartInstance = useRef<ChartJS | null>(null)
  const [metrics, setMetrics] = useState({ mae: 0, r2: 0, accuracy: 0 })

  const aggregatedAcPower = useMemo(() => {
    return data.timestamps.map((_, i) => {
      return data.sources.reduce((sum, _, sourceIdx) => {
        return sum + (data.acPower[sourceIdx]?.[i] || 0)
      }, 0)
    })
  }, [data.timestamps, data.sources, data.acPower])

  const aggregatedDcPower = useMemo(() => {
    return data.timestamps.map((_, i) => {
      return data.sources.reduce((sum, _, sourceIdx) => {
        return sum + (data.dcPower[sourceIdx]?.[i] || 0)
      }, 0)
    })
  }, [data.timestamps, data.sources, data.dcPower])

  const aggregatedDailyYield = useMemo(() => {
    return data.timestamps.map((_, i) => {
      return data.sources.reduce((sum, _, sourceIdx) => {
        return sum + (data.dailyYield[sourceIdx]?.[i] || 0)
      }, 0)
    })
  }, [data.timestamps, data.sources, data.dailyYield])

  // Create separate predictions for different metrics
  const acPowerPredictions = useMemo(() => {
    return data.predictions[selectedModel]
  }, [data.predictions, selectedModel])

  const dcPowerPredictions = useMemo(() => {
    // DC power is typically higher than AC power due to inverter efficiency
    // Apply a realistic efficiency factor (typically 0.85-0.95)
    const efficiencyFactor = 0.92
    return data.predictions[selectedModel].map(value => value / efficiencyFactor)
  }, [data.predictions, selectedModel])

  const dailyYieldPredictions = useMemo(() => {
    // Daily yield predictions based on AC power with time-based scaling
    const timeScaleFactor = 0.1 // Convert power to energy over time
    return data.predictions[selectedModel].map(value => value * timeScaleFactor)
  }, [data.predictions, selectedModel])

  // Calculate metrics
  useEffect(() => {
    const actualValues = aggregatedAcPower
    const predictedValues = acPowerPredictions

    const mae =
      actualValues.reduce((sum, actual, i) => sum + Math.abs(actual - predictedValues[i]), 0) / actualValues.length

    const mean = actualValues.reduce((sum, val) => sum + val, 0) / actualValues.length
    const ssTot = actualValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0)
    const ssRes = actualValues.reduce((sum, actual, i) => sum + Math.pow(actual - predictedValues[i], 2), 0)
    const r2 = Math.max(0, 1 - ssRes / ssTot)

    const accuracy = Math.max(0, Math.min(100, (1 - mae / (mean || 1)) * 100))

    setMetrics({ mae, r2, accuracy })
  }, [aggregatedAcPower, acPowerPredictions])

  // Render chart
  useEffect(() => {
    if (!chartRef.current) return

    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    const labels = data.timestamps.map((t, i) => `T${i + 1}`)

    let chartData: any
    const chartType: "line" | "bar" | "scatter" =
      selectedChartType === "histogram" ? "bar" : selectedChartType === "scatter" ? "scatter" : selectedChartType

    if (selectedChartType === "scatter") {
      chartData = {
        datasets: [
          {
            label: "Actual AC Power",
            data: aggregatedAcPower.map((value, index) => ({ x: index, y: value })),
            backgroundColor: "rgba(16, 185, 129, 0.6)",
            borderColor: "rgba(16, 185, 129, 1)",
            pointRadius: 4,
          },
          {
            label: `${selectedModel} Predictions`,
            data: acPowerPredictions.map((value, index) => ({ x: index, y: value })),
            backgroundColor: "rgba(59, 130, 246, 0.6)",
            borderColor: "rgba(59, 130, 246, 1)",
            pointRadius: 4,
          },
        ],
      }
    } else if (selectedChartType === "histogram") {
      const bins = 20
      const min = Math.min(...aggregatedAcPower)
      const max = Math.max(...aggregatedAcPower)
      const binSize = (max - min) / bins
      const histogram = new Array(bins).fill(0)

      aggregatedAcPower.forEach((value) => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1)
        histogram[binIndex]++
      })

      chartData = {
        labels: histogram.map((_, i) => `${(min + i * binSize).toFixed(0)}-${(min + (i + 1) * binSize).toFixed(0)}`),
        datasets: [
          {
            label: "Frequency",
            data: histogram,
            backgroundColor: "rgba(16, 185, 129, 0.6)",
            borderColor: "rgba(16, 185, 129, 1)",
            borderWidth: 1,
          },
        ],
      }
    } else if (selectedChartType === "bar") {
      chartData = {
        labels,
        datasets: [
          {
            label: "Actual AC Power",
            data: aggregatedAcPower,
            backgroundColor: "rgba(16, 185, 129, 0.7)",
            borderColor: "rgba(16, 185, 129, 1)",
            borderWidth: 2,
          },
          {
            label: `${selectedModel} Predictions`,
            data: dcPowerPredictions,
            backgroundColor: "rgba(59, 130, 246, 0.7)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 2,
          },
        ],
      }
    } else {
      // Line chart configuration
      chartData = {
        labels,
        datasets: [
          {
            label: "Actual AC Power",
            data: aggregatedAcPower,
            borderColor: "rgba(16, 185, 129, 1)",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
          {
            label: `${selectedModel} Predictions`,
            data: dcPowerPredictions,
            borderColor: "rgba(59, 130, 246, 1)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
          },
        ],
      }
    }

    chartInstance.current = new ChartJS(ctx, {
      type: chartType,
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: { color: "rgb(156, 163, 175)" },
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales:
          selectedChartType === "scatter"
            ? {
                x: {
                  type: "linear",
                  title: { display: true, text: "Time Index", color: "rgb(156, 163, 175)" },
                  ticks: { color: "rgb(156, 163, 175)" },
                  grid: { color: "rgba(75, 85, 99, 0.3)" },
                },
                y: {
                  title: { display: true, text: "AC Power (W)", color: "rgb(156, 163, 175)" },
                  ticks: { color: "rgb(156, 163, 175)" },
                  grid: { color: "rgba(75, 85, 99, 0.3)" },
                },
              }
            : {
                x: {
                  ticks: { color: "rgb(156, 163, 175)" },
                  grid: { color: "rgba(75, 85, 99, 0.3)" },
                },
                y: {
                  title: {
                    display: true,
                    text: selectedChartType === "histogram" ? "Frequency" : "AC Power (W)",
                    color: "rgb(156, 163, 175)",
                  },
                  ticks: { color: "rgb(156, 163, 175)" },
                  grid: { color: "rgba(75, 85, 99, 0.3)" },
                },
              },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data.timestamps, selectedModel, selectedChartType, aggregatedAcPower, acPowerPredictions])

  // DC Power Chart
  useEffect(() => {
    if (!dcPowerChartRef.current) return

    if (dcPowerChartInstance.current) {
      dcPowerChartInstance.current.destroy()
    }

    const ctx = dcPowerChartRef.current.getContext("2d")
    if (!ctx) return

    const labels = data.timestamps.map((_, i) => `T${i + 1}`)
    const chartType: "line" | "bar" | "scatter" =
      selectedChartType === "histogram" ? "bar" : selectedChartType === "scatter" ? "scatter" : selectedChartType

    let chartData: any

    if (selectedChartType === "scatter") {
      chartData = {
        datasets: [
          {
            label: "Predicted DC Power",
            data: acPowerPredictions.map((value, index) => ({ x: index, y: value })),
            backgroundColor: "rgba(34, 197, 94, 0.6)",
            borderColor: "rgba(34, 197, 94, 1)",
            pointRadius: 4,
          },
        ],
      }
    } else if (selectedChartType === "histogram") {
      const bins = 20
      const min = Math.min(...acPowerPredictions)
      const max = Math.max(...acPowerPredictions)
      const binSize = (max - min) / bins
      const histogram = new Array(bins).fill(0)

      acPowerPredictions.forEach((value) => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1)
        histogram[binIndex]++
      })

      chartData = {
        labels: histogram.map((_, i) => `${(min + i * binSize).toFixed(0)}-${(min + (i + 1) * binSize).toFixed(0)}`),
        datasets: [
          {
            label: "Frequency",
            data: histogram,
            backgroundColor: "rgba(34, 197, 94, 0.6)",
            borderColor: "rgba(34, 197, 94, 1)",
            borderWidth: 1,
          },
        ],
      }
    } else if (selectedChartType === "bar") {
      chartData = {
        labels,
        datasets: [
          {
            label: "Predicted DC Power",
            data: dcPowerPredictions,
            backgroundColor: "rgba(34, 197, 94, 0.7)",
            borderColor: "rgba(34, 197, 94, 1)",
            borderWidth: 2,
          },
        ],
      }
    } else {
      // Line chart configuration
      chartData = {
        labels,
        datasets: [
          {
            label: "Predicted DC Power",
            data: dcPowerPredictions,
            borderColor: "rgba(34, 197, 94, 1)",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      }
    }

    dcPowerChartInstance.current = new ChartJS(ctx, {
      type: chartType,
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          tooltip: { mode: "index", intersect: false },
        },
        scales:
          selectedChartType === "scatter"
            ? {
                x: {
                  type: "linear",
                  title: { display: true, text: "Time Index", color: "rgb(156, 163, 175)" },
                  ticks: { color: "rgb(156, 163, 175)" },
                  grid: { color: "rgba(75, 85, 99, 0.3)" },
                },
                y: {
                  title: { display: true, text: "DC Power (W)", color: "rgb(156, 163, 175)" },
                  ticks: { color: "rgb(156, 163, 175)" },
                  grid: { color: "rgba(75, 85, 99, 0.3)" },
                },
              }
            : {
                x: {
                  ticks: { color: "rgb(156, 163, 175)" },
                  grid: { color: "rgba(75, 85, 99, 0.3)" },
                },
                y: {
                  title: {
                    display: true,
                    text: selectedChartType === "histogram" ? "Frequency" : "DC Power (W)",
                    color: "rgb(156, 163, 175)",
                  },
                  ticks: { color: "rgb(156, 163, 175)" },
                  grid: { color: "rgba(75, 85, 99, 0.3)" },
                },
              },
      },
    })

    return () => {
      if (dcPowerChartInstance.current) {
        dcPowerChartInstance.current.destroy()
      }
    }
  }, [data.timestamps, selectedModel, selectedChartType, dcPowerPredictions])

  // AC Power Chart
  useEffect(() => {
    if (!acPowerChartRef.current) return

    if (acPowerChartInstance.current) {
      acPowerChartInstance.current.destroy()
    }

    const ctx = acPowerChartRef.current.getContext("2d")
    if (!ctx) return

    const labels = data.timestamps.map((_, i) => `T${i + 1}`)
    const chartType: "line" | "bar" | "scatter" =
      selectedChartType === "histogram" ? "bar" : selectedChartType === "scatter" ? "scatter" : selectedChartType

    let chartData: any

    if (selectedChartType === "scatter") {
      chartData = {
        datasets: [
          {
            label: "Predicted AC Power",
            data: acPowerPredictions.map((value, index) => ({ x: index, y: value })),
            backgroundColor: "rgba(59, 130, 246, 0.6)",
            borderColor: "rgba(59, 130, 246, 1)",
            pointRadius: 4,
          },
        ],
      }
    } else if (selectedChartType === "histogram") {
      const bins = 20
      const min = Math.min(...acPowerPredictions)
      const max = Math.max(...acPowerPredictions)
      const binSize = (max - min) / bins
      const histogram = new Array(bins).fill(0)

      acPowerPredictions.forEach((value) => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1)
        histogram[binIndex]++
      })

      chartData = {
        labels: histogram.map((_, i) => `${(min + i * binSize).toFixed(0)}-${(min + (i + 1) * binSize).toFixed(0)}`),
        datasets: [
          {
            label: "Frequency",
            data: histogram,
            backgroundColor: "rgba(59, 130, 246, 0.6)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 1,
          },
        ],
      }
    } else if (selectedChartType === "bar") {
      chartData = {
        labels,
        datasets: [
          {
            label: "Predicted AC Power",
            data: dcPowerPredictions,
            backgroundColor: "rgba(59, 130, 246, 0.7)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 2,
          },
        ],
      }
    } else {
      // Line chart configuration
      chartData = {
        labels,
        datasets: [
          {
            label: "Predicted AC Power",
            data: dcPowerPredictions,
            borderColor: "rgba(59, 130, 246, 1)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      }
    }

    acPowerChartInstance.current = new ChartJS(ctx, {
      type: chartType,
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          tooltip: { mode: "index", intersect: false },
        },
        scales:
          selectedChartType === "scatter"
            ? {
                x: {
                  type: "linear",
                  title: { display: true, text: "Time Index", color: "rgb(156, 163, 175)" },
                  ticks: { color: "rgb(156, 163, 175)" },
                  grid: { color: "rgba(75, 85, 99, 0.3)" },
                },
                y: {
                  title: { display: true, text: "AC Power (W)", color: "rgb(156, 163, 175)" },
                  ticks: { color: "rgb(156, 163, 175)" },
                  grid: { color: "rgba(75, 85, 99, 0.3)" },
                },
              }
            : {
                x: {
                  ticks: { color: "rgb(156, 163, 175)" },
                  grid: { color: "rgba(75, 85, 99, 0.3)" },
                },
                y: {
                  title: {
                    display: true,
                    text: selectedChartType === "histogram" ? "Frequency" : "AC Power (W)",
                    color: "rgb(156, 163, 175)",
                  },
                  ticks: { color: "rgb(156, 163, 175)" },
                  grid: { color: "rgba(75, 85, 99, 0.3)" },
                },
              },
      },
    })

    return () => {
      if (acPowerChartInstance.current) {
        acPowerChartInstance.current.destroy()
      }
    }
  }, [data.timestamps, selectedModel, selectedChartType, acPowerPredictions])

  // Daily Yield Chart
  useEffect(() => {
    if (!dailyYieldChartRef.current) return

    if (dailyYieldChartInstance.current) {
      dailyYieldChartInstance.current.destroy()
    }

    const ctx = dailyYieldChartRef.current.getContext("2d")
    if (!ctx) return

    const labels = data.timestamps.map((_, i) => `T${i + 1}`)
    const chartType: "line" | "bar" | "scatter" =
      selectedChartType === "histogram" ? "bar" : selectedChartType === "scatter" ? "scatter" : selectedChartType

    let chartData: any

    if (selectedChartType === "scatter") {
      chartData = {
        datasets: [
          {
            label: "Predicted Daily Yield",
            data: dailyYieldPredictions.map((value, index) => ({ x: index, y: value })),
            backgroundColor: "rgba(168, 85, 247, 0.6)",
            borderColor: "rgba(168, 85, 247, 1)",
            pointRadius: 6,
          },
        ],
      }
    } else if (selectedChartType === "histogram") {
      const bins = 20
      const min = Math.min(...dailyYieldPredictions)
      const max = Math.max(...dailyYieldPredictions)
      const binSize = (max - min) / bins
      const histogram = new Array(bins).fill(0)

      dailyYieldPredictions.forEach((value) => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1)
        histogram[binIndex]++
      })

      chartData = {
        labels: histogram.map((_, i) => `${(min + i * binSize).toFixed(0)}-${(min + (i + 1) * binSize).toFixed(0)}`),
        datasets: [
          {
            label: "Frequency",
            data: histogram,
            backgroundColor: "rgba(168, 85, 247, 0.6)",
            borderColor: "rgba(168, 85, 247, 1)",
            borderWidth: 1,
          },
        ],
      }
    } else if (selectedChartType === "bar") {
      chartData = {
        labels,
        datasets: [
          {
            label: "Predicted Daily Yield",
            data: dcPowerPredictions,
            backgroundColor: "rgba(168, 85, 247, 0.7)",
            borderColor: "rgba(168, 85, 247, 1)",
            borderWidth: 2,
          },
        ],
      }
    } else {
      // Line chart configuration
      chartData = {
        labels,
        datasets: [
          {
            label: "Predicted Daily Yield",
            data: dcPowerPredictions,
            borderColor: "rgba(168, 85, 247, 1)",
            backgroundColor: "rgba(168, 85, 247, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      }
    }

    dailyYieldChartInstance.current = new ChartJS(ctx, {
      type: chartType,
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          tooltip: { mode: "index", intersect: false },
        },
        scales:
          selectedChartType === "scatter"
            ? {
                x: {
                  type: "linear",
                  title: { display: true, text: "Time Index", color: "rgb(156, 163, 175)" },
                  ticks: { color: "rgb(156, 163, 175)" },
                  grid: { color: "rgba(75, 85, 99, 0.3)" },
                },
                y: {
                  title: { display: true, text: "Daily Yield (Wh)", color: "rgb(156, 163, 175)" },
                  ticks: { color: "rgb(156, 163, 175)" },
                  grid: { color: "rgba(75, 85, 99, 0.3)" },
                },
              }
            : {
                x: {
                  ticks: { color: "rgb(156, 163, 175)" },
                  grid: { color: "rgba(75, 85, 99, 0.3)" },
                },
                y: {
                  title: {
                    display: true,
                    text: selectedChartType === "histogram" ? "Frequency" : "Daily Yield (Wh)",
                    color: "rgb(156, 163, 175)",
                  },
                  ticks: { color: "rgb(156, 163, 175)" },
                  grid: { color: "rgba(75, 85, 99, 0.3)" },
                },
              },
      },
    })

    return () => {
      if (dailyYieldChartInstance.current) {
        dailyYieldChartInstance.current.destroy()
      }
    }
  }, [data.timestamps, selectedModel, selectedChartType, dailyYieldPredictions])

  // Calculate summary statistics based on selected model predictions
  const totalDcPower = dcPowerPredictions.reduce((sum, val) => sum + val, 0)
  const totalAcPower = acPowerPredictions.reduce((sum, val) => sum + val, 0)
  const avgDailyYield = dailyYieldPredictions.reduce((sum, val) => sum + val, 0) / dailyYieldPredictions.length
  const totalSources = data.sources.length

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Solar Power Plant Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Analyzing {data.timestamps.length} timestamps across {totalSources} sources
            </p>
          </div>
          <Button
            onClick={onUploadNew}
            variant="outline"
            className="border-emerald-500/30 hover:bg-emerald-500/10 bg-transparent"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload New Data
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-emerald-500/30 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total DC Power</CardTitle>
              <Sun className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(totalDcPower / 1000).toFixed(2)} kW</div>
              <p className="text-xs text-muted-foreground mt-1">Cumulative across all sources</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total AC Power</CardTitle>
              <Zap className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(totalAcPower / 1000).toFixed(2)} kW</div>
              <p className="text-xs text-muted-foreground mt-1">Cumulative output power</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Daily Yield</CardTitle>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(avgDailyYield / 1000).toFixed(2)} kWh</div>
              <p className="text-xs text-muted-foreground mt-1">Average per source</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Model Accuracy</CardTitle>
              <Activity className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.accuracy.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                MAE: {metrics.mae.toFixed(2)} | R²: {metrics.r2.toFixed(3)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Select Model</label>
                <Select value={selectedModel} onValueChange={(value) => onModelChange(value as ModelType)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PCA">PCA (Principal Component Analysis)</SelectItem>
                    <SelectItem value="Rainforest">Random Forest</SelectItem>
                    <SelectItem value="RNN">RNN (Recurrent Neural Network)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Chart Type</label>
                <Select value={selectedChartType} onValueChange={(value) => onChartTypeChange(value as ChartType)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="scatter">Scatter Plot</SelectItem>
                    <SelectItem value="histogram">Histogram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>AC Power Analysis - {selectedModel} Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              <canvas ref={chartRef}></canvas>
            </div>
          </CardContent>
        </Card>

        {/* Additional Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Total DC Power Chart */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Total DC Power - {selectedModel} Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <canvas ref={dcPowerChartRef}></canvas>
              </div>
            </CardContent>
          </Card>

          {/* Total AC Power Chart */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Total AC Power - {selectedModel} Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <canvas ref={acPowerChartRef}></canvas>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Avg Daily Yield Chart */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Average Daily Yield - {selectedModel} Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <canvas ref={dailyYieldChartRef}></canvas>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
