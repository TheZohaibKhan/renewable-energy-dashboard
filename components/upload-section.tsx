"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileSpreadsheet, Download } from "lucide-react"
import * as XLSX from "xlsx"
import type { ParsedData } from "@/app/page"
import { pcaPredict, randomForestPredict, rnnPredict, computeWeatherAdjustment, applyAdjustment } from "@/lib/ml-models"

interface UploadSectionProps {
  onFileProcessed: (data: ParsedData) => void
}

export default function UploadSection({ onFileProcessed }: UploadSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && isValidFile(file)) {
      setSelectedFile(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && isValidFile(file)) {
      setSelectedFile(file)
    }
  }

  const isValidFile = (file: File) => {
    const validTypes = [".csv", ".xls", ".xlsx"]
    return validTypes.some((type) => file.name.toLowerCase().endsWith(type))
  }

  const generatePredictions = (originalData: number[], weatherFactor?: number[]) => {
    console.log("[v0] Starting ML predictions with", originalData.length, "data points")

    // Run actual ML models
    const pcaBase = pcaPredict(originalData)
    const rfBase = randomForestPredict(originalData)
    const rnnBase = rnnPredict(originalData)

    const pcaPredictions = weatherFactor ? applyAdjustment(pcaBase, weatherFactor) : pcaBase
    const randomForestPredictions = weatherFactor ? applyAdjustment(rfBase, weatherFactor) : rfBase
    const rnnPredictions = weatherFactor ? applyAdjustment(rnnBase, weatherFactor) : rnnBase

    console.log("[v0] PCA predictions generated:", pcaPredictions.slice(0, 5))
    console.log("[v0] Random Forest predictions generated:", randomForestPredictions.slice(0, 5))
    console.log("[v0] RNN predictions generated:", rnnPredictions.slice(0, 5))

    return {
      PCA: pcaPredictions,
      Rainforest: randomForestPredictions,
      RNN: rnnPredictions,
    }
  }

  const handleProcessData = async () => {
    if (!selectedFile) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: "binary" })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet)

      // Extract solar energy values
      const solarEnergyData = jsonData
        .map((row: any) => {
          return Number.parseFloat(row["Solar energy"] || row["solar_energy"] || row["energy"] || 0)
        })
        .filter((val) => !isNaN(val))

      // Extract weather features if present (case-insensitive fallbacks)
      const toNum = (v: any) => {
        const n = Number.parseFloat(v)
        return isNaN(n) ? undefined : n
      }
      const pick = (row: any, keys: string[]) => {
        for (const k of keys) if (row[k] !== undefined) return row[k]
        return undefined
      }

      const temperature: number[] = []
      const humidity: number[] = []
      const cloudCover: number[] = []
      const visibility: number[] = []
      const windSpeed: number[] = []

      for (const row of jsonData as any[]) {
        const t = toNum(pick(row, ["Temperature", "temperature", "Temp", "temp"]))
        const h = toNum(pick(row, ["Relative humi", "Relative humidity", "Humidity", "humidity"]))
        const c = toNum(pick(row, ["Cloud coverage", "Cloud cover", "cloud", "Cloud"]))
        const v = toNum(pick(row, ["Visibility", "visibility"]))
        const w = toNum(pick(row, ["Wind speed", "WindSpeed", "wind", "Wind"]))

        if (t !== undefined) temperature.push(t)
        if (h !== undefined) humidity.push(h)
        if (c !== undefined) cloudCover.push(c > 1 ? c / 100 : c) // accept 0-1 or %
        if (v !== undefined) visibility.push(v)
        if (w !== undefined) windSpeed.push(w)
      }

      let weatherFactor: number[] | undefined
      if (solarEnergyData.length > 0) {
        const len = solarEnergyData.length
        if (temperature.length === len || humidity.length === len || cloudCover.length === len || visibility.length === len || windSpeed.length === len) {
          weatherFactor = computeWeatherAdjustment({ temperature, humidity, cloudCover, visibility, windSpeed }, len)
          console.log("[v0] Weather factor sample:", weatherFactor.slice(0, 5))
        }
      }

      if (solarEnergyData.length > 0) {
        const predictions = generatePredictions(solarEnergyData, weatherFactor)
        onFileProcessed({
          originalData: solarEnergyData,
          predictions,
        })
      }
    }
    reader.readAsBinaryString(selectedFile)
  }

  const handleDownloadSample = () => {
    // Create sample CSV data
    const sampleData = [
      ["Date", "Solar energy", "Temperature", "Humidity"],
      ["2024-01-01", "450", "25", "60"],
      ["2024-01-02", "480", "26", "58"],
      ["2024-01-03", "420", "24", "62"],
      ["2024-01-04", "510", "27", "55"],
      ["2024-01-05", "490", "26", "57"],
    ]

    const csv = sampleData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sample_solar_data.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Upload Your Weather Data</h1>
          <p className="text-xl text-muted-foreground">Upload your Weather data to begin the analysis</p>
        </div>

        <Card className="border-2 border-dashed border-border hover:border-emerald-500/50 transition-colors">
          <CardContent className="pt-12 pb-12">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer text-center space-y-6 p-8 rounded-lg transition-colors ${
                isDragging ? "bg-emerald-500/10" : "hover:bg-muted/50"
              }`}
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Upload className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {selectedFile ? selectedFile.name : "Drag and drop your file here"}
                </p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
                <p className="text-xs text-muted-foreground">Supports CSV, XLS, and XLSX files</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {selectedFile && (
              <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span className="flex-1 text-sm font-medium">{selectedFile.name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            onClick={handleProcessData}
            disabled={!selectedFile}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            Process Data
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleDownloadSample}
            className="border-emerald-500/30 hover:bg-emerald-500/10 bg-transparent"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Sample
          </Button>
        </div>
      </div>
    </div>
  )
}
