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
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Quick Brief (AI Input)</label>
        <div className="flex gap-2">
          <Textarea
            placeholder="e.g. discuss marketing budget for Q3"
            value={briefInput}
            onChange={(e) => setBriefInput(e.target.value)}
            className="min-h-[60px] resize-none"
          />
          <Button
            type="button"
            variant="outline"
            className="h-auto shrink-0 border-primary text-primary hover:bg-primary/5"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Magic</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Final Professional Description</label>
        <Textarea
          placeholder="Professional description will appear here..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[120px]"
        />
      </div>
    </div>
  )
}