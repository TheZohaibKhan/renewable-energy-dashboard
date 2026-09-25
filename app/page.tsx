"use client"

import { useState } from "react"
import HomeSection from "@/components/home-section"
import UploadSection from "@/components/upload-section"
import ProcessingSection from "@/components/processing-section"
import DashboardSection from "@/components/dashboard-section"
import SolarUploadSection from "@/components/solar-upload-section"
import SolarDashboardSection from "@/components/solar-dashboard-section"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type ModelType = "PCA" | "Rainforest" | "RNN"
export type ChartType = "line" | "bar" | "scatter" | "histogram"

export interface ParsedData {
  originalData: number[]
  predictions: {
    PCA: number[]
    Rainforest: number[]
    RNN: number[]
  }
}

export interface SolarParsedData {
  timestamps: string[]
  sources: string[]
  dcPower: number[][]
  acPower: number[][]
  dailyYield: number[][]
  totalYield: number[][]
  predictions: {
    PCA: number[]
    Rainforest: number[]
    RNN: number[]
  }
}

export default function Page() {
  const [datasetType, setDatasetType] = useState<"renewable" | "solar">("renewable")
  const [currentView, setCurrentView] = useState<"home" | "upload" | "processing" | "dashboard">("home")
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [solarData, setSolarData] = useState<SolarParsedData | null>(null)
  const [selectedModel, setSelectedModel] = useState<ModelType>("PCA")
  const [selectedChartType, setSelectedChartType] = useState<ChartType>("line")

  const handleGetStarted = () => {
    setCurrentView("upload")
  }

  const handleFileProcessed = (data: ParsedData) => {
    setParsedData(data)
    setCurrentView("processing")

    setTimeout(() => {
      setCurrentView("dashboard")
    }, 2500)
  }

  const handleSolarFileProcessed = (data: SolarParsedData) => {
    setSolarData(data)
    setCurrentView("processing")

    setTimeout(() => {
      setCurrentView("dashboard")
    }, 2500)
  }

  const handleUploadNew = () => {
    setCurrentView("upload")
    setParsedData(null)
    setSolarData(null)
    setSelectedModel("PCA")
    setSelectedChartType("line")
  }

  const handleDatasetTypeChange = (type: "renewable" | "solar") => {
    setDatasetType(type)
    setCurrentView("home")
    setParsedData(null)
    setSolarData(null)
    setSelectedModel("PCA")
    setSelectedChartType("line")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {currentView === "home" && (
        <div className="fixed top-4 right-4 z-50">
          <Tabs value={datasetType} onValueChange={(v) => handleDatasetTypeChange(v as "renewable" | "solar")}>
            <TabsList>
              <TabsTrigger value="renewable">Renewable Energy</TabsTrigger>
              <TabsTrigger value="solar">Solar Power Plant</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {currentView === "home" && <HomeSection onGetStarted={handleGetStarted} datasetType={datasetType} />}

      {currentView === "upload" && datasetType === "renewable" && (
        <UploadSection onFileProcessed={handleFileProcessed} />
      )}
      {currentView === "upload" && datasetType === "solar" && (
        <SolarUploadSection onFileProcessed={handleSolarFileProcessed} />
      )}

      {currentView === "processing" && <ProcessingSection />}

      {currentView === "dashboard" && datasetType === "renewable" && parsedData && (
        <DashboardSection
          data={parsedData}
          selectedModel={selectedModel}
          selectedChartType={selectedChartType}
          onModelChange={setSelectedModel}
          onChartTypeChange={setSelectedChartType}
          onUploadNew={handleUploadNew}
        />
      )}
      {currentView === "dashboard" && datasetType === "solar" && solarData && (
        <SolarDashboardSection
          data={solarData}
          selectedModel={selectedModel}
          selectedChartType={selectedChartType}
          onModelChange={setSelectedModel}
          onChartTypeChange={setSelectedChartType}
          onUploadNew={handleUploadNew}
        />
      )}
    </div>
  )
}
