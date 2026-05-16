"use client"

import { useMemoFirebase, useFirestore, useUser, useCollection } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  Link as LinkIcon, 
  Inbox, 
  Mail, 
  AlertCircle, 
  Copy, 
  Check, 
  Image as ImageIcon,
  ExternalLink,
  Video,
  CalendarDays
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, isPast } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Meeting } from "@/lib/types"
import { useMemo, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export default function HistoryPage() {
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null)

  const meetingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(
      collection(firestore, "meetings"),
      where("userId", "==", user.uid)
    )
  }, [firestore, user])

  const { data: rawMeetings, isLoading: isMeetingsLoading } = useCollection<Meeting>(meetingsQuery)

  const sortedMeetings = useMemo(() => {
    if (!rawMeetings) return []
    return [...rawMeetings].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [rawMeetings])

  const handleCopyLink = async (link: string, id: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(id)
      toast({
        title: "Link Copied",
        description: "Meeting link has been copied to your clipboard.",
      })
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast({
        title: "Manual Copy Required",
        description: `Please copy this link manually: ${link}`,
        variant: "destructive"
      })
    }
  }

  if (isUserLoading || isMeetingsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="rounded-2xl border bg-white/50 p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const getStatusBadge = (meeting: Meeting) => {
    const isPastSession = meeting.status === 'confirmed' && meeting.slotEndTime && isPast(new Date(meeting.slotEndTime))
    
    if (meeting.status === 'done') return <Badge variant="outline" className="px-3">Completed</Badge>
    if (isPastSession) return <Badge variant="secondary" className="px-3">Past Session</Badge>

    const variants: Record<string, string> = {
      pending: 'secondary',
      confirmed: 'default',
      rejected: 'destructive',
    }

    return (
      <Badge
        variant={variants[meeting.status] as any}
        className="capitalize px-4 py-1 font-black rounded-lg text-[10px] tracking-wide"
      >
        {meeting.status}
      </Badge>
    )
  }

  const formatSlotRange = (start?: string, end?: string) => {
    if (!start) return "—"
    const startDate = new Date(start)
    const startTime = format(startDate, "MMM d, p")
    if (!end) return startTime
    const endDate = new Date(end)
    const endTime = format(endDate, "p")
    return `${startTime} - ${endTime}`
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-full">
      <div>
        <h2 className="text-2xl md:text-3xl font-headline font-bold text-primary">Meeting History</h2>
        <p className="text-sm md:text-base text-muted-foreground font-medium">Track your requested and confirmed consultations.</p>
      </div>

      <div className="rounded-2xl md:rounded-[2rem] border-none shadow-2xl bg-white/80 dark:bg-card/40 backdrop-blur-md overflow-hidden w-full max-w-full">
        {sortedMeetings.length > 0 ? (
          <div className="overflow-x-auto scrollbar-hide w-full">
            <Table>
              <TableHeader className="bg-primary/5">
                <TableRow className="hover:bg-transparent border-primary/10">
                  <TableHead className="py-4 md:py-5 pl-4 md:pl-6 font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[10px] whitespace-nowrap px-3">Details</TableHead>
                  <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[10px] whitespace-nowrap px-3">Meet Link</TableHead>
                  <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[10px] whitespace-nowrap px-3">Requested</TableHead>
                  <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[10px] whitespace-nowrap px-3">Meeting Slot</TableHead>
                  <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[10px] whitespace-nowrap px-3">Status</TableHead>
                  <TableHead className="pr-4 md:pr-6 text-right font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[10px] whitespace-nowrap px-3">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMeetings.map((meeting) => (
                  <TableRow key={meeting.id} className="border-primary/5 hover:bg-primary/5 transition-colors group">
                    <TableCell className="py-3 md:py-4 pl-4 md:pl-6 px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Mail className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs md:text-sm truncate max-w-[120px]">{meeting.clientName}</p>
                          <p className="text-[9px] text-muted-foreground font-medium truncate max-w-[120px]">{meeting.clientEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3">
                      {meeting.meetingLink ? (
                        <div className="flex items-center gap-1.5 group/link">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10 max-w-[120px]">
                            <Video className="h-3 w-3 text-primary shrink-0" />
                            <span className="text-[9px] md:text-xs font-bold text-primary truncate">{meeting.meetingLink}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-lg text-primary hover:bg-primary hover:text-white transition-all"
                            onClick={() => handleCopyLink(meeting.meetingLink!, meeting.id)}
                            title="Copy Meet Link"
                          >
                            {copiedId === meeting.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[9px] md:text-xs text-muted-foreground italic font-medium opacity-60">Pending approval</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3">
                      <div className="flex items-center gap-1 text-[9px] md:text-xs font-medium text-muted-foreground/80 whitespace-nowrap">
                        {format(new Date(meeting.createdAt), "MMM d, p")}
                      </div>
                    </TableCell>
                    <TableCell className="px-3">
                      <div className="flex items-center gap-1 text-[9px] md:text-xs font-bold text-foreground whitespace-nowrap">
                        <Clock className="h-3 w-3 text-primary/60 shrink-0" />
                        {formatSlotRange(meeting.slotStartTime, meeting.slotEndTime)}
                      </div>
                    </TableCell>
                    <TableCell className="px-3">
                      <div className="space-y-1">
                        {getStatusBadge(meeting)}
                        {meeting.status === 'rejected' && meeting.adminNotes && (
                          <div className="flex items-start gap-1 p-1.5 rounded-lg bg-destructive/5 text-destructive border border-destructive/10 max-w-[120px]">
                            <AlertCircle className="h-2.5 w-2.5 shrink-0 mt-0.5" />
                            <p className="text-[8px] md:text-[9px] font-bold leading-tight line-clamp-2">{meeting.adminNotes}</p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="pr-4 md:pr-6 text-right px-3">
                      <div className="flex flex-col sm:flex-row items-center justify-end gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 md:h-8 text-[9px] font-bold gap-1 text-primary/60 hover:text-primary hover:bg-primary/5"
                          onClick={() => setViewingProofUrl(meeting.paymentProofUrl)}
                        >
                          <ImageIcon className="h-3 w-3" /> Proof
                        </Button>

                        {meeting.status === 'confirmed' && meeting.meetingLink && (!meeting.slotEndTime || !isPast(new Date(meeting.slotEndTime))) && (
                          <Button size="sm" className="bg-primary hover:bg-primary/90 font-bold rounded-lg h-7 md:h-8 gap-1 shadow-lg shadow-primary/20" asChild>
                            <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                              <LinkIcon className="h-3 w-3" /> <span className="hidden sm:inline">Join</span>
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-16 md:py-24 text-center space-y-4 md:space-y-6 bg-white/40 dark:bg-transparent">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl md:rounded-3xl bg-muted/20 mx-auto flex items-center justify-center">
              <Inbox className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground/30" />
            </div>
            <div className="space-y-1 md:space-y-2">
              <h3 className="text-xl md:text-2xl font-headline font-bold text-muted-foreground">No History</h3>
              <p className="text-sm md:text-base text-muted-foreground max-w-xs mx-auto font-medium">You haven't requested any meetings yet.</p>
            </div>
            <Button onClick={() => window.location.href = '/dashboard'} className="bg-primary rounded-xl h-10 md:h-12 px-6 md:px-8 font-bold">Schedule Now</Button>
          </div>
        )}
      </div>

      <Dialog open={!!viewingProofUrl} onOpenChange={(open) => !open && setViewingProofUrl(null)}>
        <DialogContent className="max-w-2xl w-[95vw] rounded-2xl md:rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-card">
          <div className="p-6 md:p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-xl md:text-2xl font-headline font-bold text-primary">Payment Proof</DialogTitle>
              <DialogDescription className="text-xs md:text-sm font-medium text-muted-foreground">Your uploaded transaction receipt for verification.</DialogDescription>
            </DialogHeader>
            
            <div className="relative aspect-[3/4] md:aspect-video w-full rounded-2xl bg-muted/20 border border-primary/5 overflow-hidden group">
              {viewingProofUrl ? (
                <img 
                  src={viewingProofUrl} 
                  className="w-full h-full object-contain bg-black/5" 
                  alt="Transaction Proof" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              )}
              {viewingProofUrl && (
                <a 
                  href={viewingProofUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="absolute bottom-4 right-4 h-10 w-10 bg-white/90 dark:bg-card/90 backdrop-blur-sm rounded-xl shadow-xl flex items-center justify-center text-primary hover:scale-110 transition-transform"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              )}
            </div>

            <div className="pt-2">
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl font-bold border-primary/10 hover:bg-primary/5"
                onClick={() => setViewingProofUrl(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
