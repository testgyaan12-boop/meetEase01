
"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { generateMeetingDescription } from "@/ai/flows/generate-meeting-description"
import { useToast } from "@/hooks/use-toast"

interface MeetingDescriptionAIProps {
  value: string
  onChange: (value: string) => void
}

export function MeetingDescriptionAI({ value, onChange }: MeetingDescriptionAIProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [briefInput, setBriefInput] = useState("")
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!briefInput.trim()) {
      toast({
        title: "Empty input",
        description: "Please provide a brief summary of the meeting first.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateMeetingDescription({ briefInput })
      onChange(result)
      toast({
        title: "Description generated!",
        description: "Your meeting description has been professionally expanded.",
      })
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Something went wrong while generating the description.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 p-4 md:p-6 rounded-2xl bg-primary/5 border border-primary/10 border-dashed">
        <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">AI Quick Prompt</label>
        <div className="flex gap-3">
          <Textarea
            placeholder="e.g. discuss salary negotiation strategy for a senior manager role"
            value={briefInput}
            onChange={(e) => setBriefInput(e.target.value)}
            className="min-h-[60px] md:min-h-[80px] bg-white border-none shadow-sm rounded-xl font-medium text-xs md:text-sm resize-none"
          />
          <Button
            type="button"
            className="h-auto shrink-0 bg-primary hover:bg-primary/90 text-white rounded-xl px-4 md:px-6 shadow-lg shadow-primary/20 transition-all active:scale-95"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
            <span className="ml-2 hidden sm:inline font-bold">Magic</span>
          </Button>
        </div>
        <p className="text-[9px] text-muted-foreground italic font-medium">Brief keywords will be expanded into a professional agenda.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Professional Agenda</label>
        <Textarea
          placeholder="Professional description will appear here..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[120px] md:min-h-[160px] rounded-xl md:rounded-[2rem] bg-muted/40 border-none shadow-inner p-4 md:p-8 text-sm md:text-base font-bold text-foreground resize-none leading-relaxed"
        />
      </div>
    </div>
  )
}
