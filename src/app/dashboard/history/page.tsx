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
  Video
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

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-full">
      <div>
        <h2 className="text-2xl md:text-3xl font-headline font-bold text-primary">Meeting History</h2>
        <p className="text-sm md:text-base text-muted-foreground font-medium">Track your requested and confirmed consultations.</p>
      </div>

      <div className="rounded-2xl md:rounded-[2.5rem] border-none shadow-2xl bg-white/80 dark:bg-card/40 backdrop-blur-md overflow-hidden w-full max-w-full">
        {sortedMeetings.length > 0 ? (
          <div className="overflow-x-auto scrollbar-hide w-full">
            <Table>
              <TableHeader className="bg-primary/5">
                <TableRow className="hover:bg-transparent border-primary/10">
                  <TableHead className="py-4 md:py-6 pl-4 md:pl-8 font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[11px]">Details</TableHead>
                  <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[11px]">Meet Link</TableHead>
                  <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[11px]">Schedule</TableHead>
                  <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[11px]">Status</TableHead>
                  <TableHead className="pr-4 md:pr-8 text-right font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[11px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMeetings.map((meeting) => (
                  <TableRow key={meeting.id} className="border-primary/5 hover:bg-primary/5 transition-colors group">
                    <TableCell className="py-4 md:py-6 pl-4 md:pl-8">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{meeting.clientName}</p>
                          <p className="text-[10px] text-muted-foreground font-medium truncate">{meeting.clientEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {meeting.meetingLink ? (
                        <div className="flex items-center gap-2 group/link">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10 max-w-[150px]">
                            <Video className="h-3 w-3 text-primary shrink-0" />
                            <span className="text-[10px] md:text-xs font-bold text-primary truncate">{meeting.meetingLink}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-primary hover:bg-primary hover:text-white transition-all"
                            onClick={() => handleCopyLink(meeting.meetingLink!, meeting.id)}
                            title="Copy Meet Link"
                          >
                            {copiedId === meeting.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[10px] md:text-xs text-muted-foreground italic font-medium opacity-60">Pending approval</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-[10px] md:text-sm font-bold text-foreground/80 whitespace-nowrap">
                        <Clock className="h-3 w-3 text-primary/60" />
                        {format(new Date(meeting.createdAt), "MMM d, p")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {getStatusBadge(meeting)}
                        {meeting.status === 'rejected' && meeting.adminNotes && (
                          <div className="flex items-start gap-1.5 p-2 rounded-lg bg-destructive/5 text-destructive border border-destructive/10 max-w-[140px] md:max-w-[200px]">
                            <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                            <p className="text-[9px] md:text-[10px] font-bold leading-tight">{meeting.adminNotes}</p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="pr-4 md:pr-8 text-right">
                      <div className="flex flex-col sm:flex-row items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 md:h-9 text-[10px] font-bold gap-1.5 text-primary/60 hover:text-primary hover:bg-primary/5"
                          onClick={() => setViewingProofUrl(meeting.paymentProofUrl)}
                        >
                          <ImageIcon className="h-3.5 w-3.5" /> Proof
                        </Button>

                        {meeting.status === 'confirmed' && meeting.meetingLink && (!meeting.slotEndTime || !isPast(new Date(meeting.slotEndTime))) && (
                          <Button size="sm" className="bg-primary hover:bg-primary/90 font-bold rounded-lg h-8 md:h-9 gap-1.5 shadow-lg shadow-primary/20" asChild>
                            <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                              <LinkIcon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Join</span>
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