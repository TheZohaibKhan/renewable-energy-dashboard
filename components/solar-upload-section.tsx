"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react"
import * as XLSX from "xlsx"
import { pcaPredict, randomForestPredict, rnnPredict } from "@/lib/ml-models"
import type { SolarParsedData } from "@/app/page"

interface SolarUploadSectionProps {
  onFileProcessed: (data: SolarParsedData) => void
}

export default function SolarUploadSection({ onFileProcessed }: SolarUploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFile = async (file: File) => {
    try {
      setError(null)
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

      if (jsonData.length === 0) {
        throw new Error("File is empty")
      }

      // Parse solar power plant data
      const timestamps: string[] = []
      const sources: string[] = []
      const dcPowerMap = new Map<string, number[]>()
      const acPowerMap = new Map<string, number[]>()
      const dailyYieldMap = new Map<string, number[]>()
      const totalYieldMap = new Map<string, number[]>()

      jsonData.forEach((row) => {
        const timestamp = row.DATE_TIME || row.date_time || row.timestamp
        const sourceKey = row.SOURCE_KEY || row.source_key || row.source
        const dcPower = Number.parseFloat(row.DC_POWER || row.dc_power || 0)
        const acPower = Number.parseFloat(row.AC_POWER || row.ac_power || 0)
        const dailyYield = Number.parseFloat(row.DAILY_YIELD || row.daily_yield || 0)
        const totalYield = Number.parseFloat(row.TOTAL_YIELD || row.total_yield || 0)

        if (!timestamp || !sourceKey) return

        if (!timestamps.includes(timestamp)) {
          timestamps.push(timestamp)
        }
        if (!sources.includes(sourceKey)) {
          sources.push(sourceKey)
        }

        if (!dcPowerMap.has(sourceKey)) {
          dcPowerMap.set(sourceKey, [])
          acPowerMap.set(sourceKey, [])
          dailyYieldMap.set(sourceKey, [])
          totalYieldMap.set(sourceKey, [])
        }

        dcPowerMap.get(sourceKey)!.push(dcPower)
        acPowerMap.get(sourceKey)!.push(acPower)
        dailyYieldMap.get(sourceKey)!.push(dailyYield)
        totalYieldMap.get(sourceKey)!.push(totalYield)
      })

      // Convert maps to 2D arrays
      const dcPower = sources.map((s) => dcPowerMap.get(s) || [])
      const acPower = sources.map((s) => acPowerMap.get(s) || [])
      const dailyYield = sources.map((s) => dailyYieldMap.get(s) || [])
      const totalYield = sources.map((s) => totalYieldMap.get(s) || [])

      // Aggregate AC power across all sources for predictions
      const aggregatedAcPower: number[] = []
      for (let i = 0; i < timestamps.length; i++) {
        let sum = 0
        sources.forEach((source) => {
          const sourceData = acPowerMap.get(source) || []
          sum += sourceData[i] || 0
        })
        aggregatedAcPower.push(sum)
      }

      console.log("[v0] Starting ML predictions for solar data with", aggregatedAcPower.length, "data points")

      // Generate predictions using ML models
      const pcaPredictions = pcaPredict(aggregatedAcPower)
      const rfPredictions = randomForestPredict(aggregatedAcPower)
      const rnnPredictions = rnnPredict(aggregatedAcPower)

      console.log("[v0] PCA predictions:", pcaPredictions.slice(0, 5))
      console.log("[v0] RF predictions:", rfPredictions.slice(0, 5))
      console.log("[v0] RNN predictions:", rnnPredictions.slice(0, 5))

      const parsedData: SolarParsedData = {
        timestamps,
        sources,
        dcPower,
        acPower,
        dailyYield,
        totalYield,
        predictions: {
          PCA: pcaPredictions,
          Rainforest: rfPredictions,
          RNN: rnnPredictions,
        },
      }

      onFileProcessed(parsedData)
    } catch (err) {
      console.error("[v0] Error processing file:", err)
      setError(err instanceof Error ? err.message : "Failed to process file")
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        if (file.name.endsWith(".csv") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          processFile(file)
        } else {
          setError("Please upload a CSV or Excel file")
        }
      }
    },
    [onFileProcessed],
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Upload Solar Power Data</h1>
          <p className="text-xl text-muted-foreground">
            Upload your solar power plant data with timestamps, sources, DC/AC power, and yield metrics
          </p>
        </div>

        <Card
          className={`border-2 border-dashed transition-all ${
            isDragging ? "border-emerald-500 bg-emerald-500/5" : "border-border hover:border-emerald-500/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Upload className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold">Drag and drop your file here</h3>
              <p className="text-muted-foreground">or click to browse</p>
            </div>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
            />
            <Button
              size="lg"
              onClick={() => document.getElementById("file-upload")?.click()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              Select File
            </Button>
            <p className="text-sm text-muted-foreground">Supports CSV, XLS, and XLSX files</p>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-500/50 bg-red-500/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-500">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p className="font-medium">Expected columns:</p>
          <p>DATE_TIME, PLANT_ID, SOURCE_KEY, DC_POWER, AC_POWER, DAILY_YIELD, TOTAL_YIELD</p>
        </div>
      </div>
    </div>
  )
}
