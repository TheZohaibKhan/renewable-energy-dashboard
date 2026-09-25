import { Loader2 } from "lucide-react"

export default function ProcessingSection() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-8">
        <div className="relative">
          <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-4 border-emerald-500/20 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Analyzing Data</h2>
          <p className="text-lg text-muted-foreground">Running predictive models and generating insights...</p>
        </div>
      </div>
    </div>
  )
}
