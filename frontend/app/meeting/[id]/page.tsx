"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Video, VideoOff, Mic, MicOff, Monitor, PhoneOff, Share2, Copy, Mail, Link2, Users, Settings, MessageSquare, UserPlus, MoreVertical, Maximize2, Grid3X3, Users2 } from "lucide-react"
import io, { Socket } from "socket.io-client"
import apiClient from "@/lib/api"
import { useNotifications } from "@/contexts/NotificationContext"

interface UserLite { id?: string; name?: string; role?: string }
interface PeerInfo { socketId: string; user?: UserLite | null }
interface OfferPayload { from: string; sdp: RTCSessionDescriptionInit; user?: UserLite | null }
interface AnswerPayload { from: string; sdp: RTCSessionDescriptionInit }
interface IcePayload { from: string; candidate: RTCIceCandidateInit }

export default function MeetingRoom() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const { success, error, info } = useNotifications()

  const isAdminMode = searchParams.get("admin") === "true"
  const isGuestMode = searchParams.get("guest") === "true"
  const roomCode = String(params.id)

  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [copySuccess, setCopySuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'participants' | 'chat' | 'settings'>('participants')
  const [showSidebar, setShowSidebar] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'speaker' | 'gallery'>('grid')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [micTestMode, setMicTestMode] = useState(false)
  const [guestName, setGuestName] = useState("")
  const [showGuestNameModal, setShowGuestNameModal] = useState(false)

  const [peers, setPeers] = useState<Record<string, PeerInfo>>({})
  
  const meetingLink = typeof window !== 'undefined' ? `${window.location.origin}/meeting/${params.id}?guest=true` : ''
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
      error('Copy Failed', 'Failed to copy link to clipboard')
    }
  }
  
  const handleEmailInvite = () => {
    const subject = encodeURIComponent(`Join Meeting: ${params.id}`)
    const body = encodeURIComponent(
      `You're invited to join a video meeting.\n\n` +
      `Meeting ID: ${params.id}\n` +
      `Meeting Link: ${meetingLink}\n\n` +
      `Click the link above to join the meeting.`
    )
    window.open(`mailto:${inviteEmail}?subject=${subject}&body=${body}`)
  }
  
  const handleSendInvite = () => {
    if (!inviteEmail.trim()) {
      error('Email Required', 'Please enter an email address')
      return
    }
    handleEmailInvite()
    setInviteEmail('')
    setShowInvite(false)
  }
  

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const peerVideoRefs = useRef<Record<string, HTMLVideoElement>>({})

  const socketRef = useRef<Socket | null>(null)
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({})
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (!isAdminMode && !isGuestMode) {
      if (loading) return
      if (!user) {
        router.push("/login")
        return
      }
    }
    
    // For guest mode, show name input modal if no name is set
    if (isGuestMode && !guestName) {
      setShowGuestNameModal(true)
      return
    }
    

    const init = async () => {
      try {
        // Join backend meeting for attendance logging (best-effort)
        await apiClient.joinMeeting(roomCode)
      } catch {}

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000", { transports: ["websocket"] })
      socketRef.current = socket

      socket.on("connect", () => {
        const currentUser = isGuestMode 
          ? { id: `guest-${Date.now()}`, name: guestName, role: 'guest' }
          : { id: user?.id, name: user?.name, role: user?.role }
        socket.emit("join", { room: roomCode, user: currentUser })
      })

      const createPeerConnection = (peerId: string) => {
        if (peerConnectionsRef.current[peerId]) return peerConnectionsRef.current[peerId]
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] }],
        })
        localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current as MediaStream))
        pc.onicecandidate = (e) => { if (e.candidate) socketRef.current?.emit("ice-candidate", { to: peerId, candidate: e.candidate }) }
        pc.ontrack = (event) => { const v = peerVideoRefs.current[peerId]; if (v) v.srcObject = event.streams[0] }
        peerConnectionsRef.current[peerId] = pc
        return pc
      }

      socket.on("existing-peers", async (list: PeerInfo[]) => {
        for (const p of list) {
          setPeers((prev) => ({ ...prev, [p.socketId]: p }))
          const pc = createPeerConnection(p.socketId)
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          socket.emit("offer", { to: p.socketId, sdp: offer })
        }
      })

      socket.on("user-joined", async ({ socketId, user: joinedUser }: { socketId: string; user?: UserLite | null }) => {
        setPeers((prev) => ({ ...prev, [socketId]: { socketId, user: joinedUser } }))
        const pc = createPeerConnection(socketId)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit("offer", { to: socketId, sdp: offer })
      })

      socket.on("offer", async ({ from, sdp, user: remoteUser }: OfferPayload) => {
        setPeers((prev) => ({ ...prev, [from]: { socketId: from, user: remoteUser } }))
        const pc = createPeerConnection(from)
        await pc.setRemoteDescription(new RTCSessionDescription(sdp))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit("answer", { to: from, sdp: answer })
      })

      socket.on("answer", async ({ from, sdp }: AnswerPayload) => {
        const pc = peerConnectionsRef.current[from]
        if (!pc) return
        await pc.setRemoteDescription(new RTCSessionDescription(sdp))
      })

      socket.on("ice-candidate", async ({ from, candidate }: IcePayload) => {
        const pc = peerConnectionsRef.current[from]
        if (!pc) return
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch {}
      })

      socket.on("user-left", ({ socketId }: { socketId: string }) => {
        const pc = peerConnectionsRef.current[socketId]
        if (pc) pc.close()
        delete peerConnectionsRef.current[socketId]
        setPeers((prev) => { const copy = { ...prev }; delete copy[socketId]; return copy })
        const v = peerVideoRefs.current[socketId]
        if (v) { v.srcObject = null; delete peerVideoRefs.current[socketId] }
      })

      socket.on('existing-peers', (peers: Array<{ socketId: string; user: any }>) => {
        console.log('Existing peers:', peers)
        const newPeers: Record<string, PeerInfo> = {}
        peers.forEach(({ socketId, user }) => {
          newPeers[socketId] = { socketId, user }
        })
        setPeers(newPeers)
      })

    }

    init()

    return () => {
      mediaRecorderRef.current?.stop()
      screenStreamRef.current?.getTracks().forEach((t) => t.stop())
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close())
      peerConnectionsRef.current = {}
      socketRef.current?.emit("leave")
      socketRef.current?.disconnect()
    }
  }, [user, loading, isAdminMode, isGuestMode, guestName, roomCode, router])

  const replaceVideoTrackOnPeers = (newTrack: MediaStreamTrack | null) => {
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video")
      if (sender) sender.replaceTrack(newTrack)
    })
  }

  const toggleAudio = () => {
    const stream = localStreamRef.current
    if (!stream) return
    stream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled))
    setIsAudioOn(stream.getAudioTracks().some((t) => t.enabled))
  }

  const toggleMicTest = () => {
    if (localVideoRef.current) {
      if (micTestMode) {
        localVideoRef.current.muted = true
        setMicTestMode(false)
        info("Mic Test Off", "Audio feedback prevention enabled")
      } else {
        localVideoRef.current.muted = false
        setMicTestMode(true)
        info("Mic Test On", "You can now hear yourself. Turn off to prevent echo in calls.")
      }
    }
  }

  const toggleVideo = () => {
    const stream = localStreamRef.current
    if (!stream) return
    const enabledNow = !stream.getVideoTracks()[0]?.enabled
    stream.getVideoTracks().forEach((t) => (t.enabled = enabledNow))
    setIsVideoOn(enabledNow)
  }

  const startStopScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screen = await (navigator.mediaDevices as any).getDisplayMedia({ video: true })
        screenStreamRef.current = screen
        if (screenVideoRef.current) screenVideoRef.current.srcObject = screen
        const track = screen.getVideoTracks()[0]
        replaceVideoTrackOnPeers(track)
        setIsScreenSharing(true)
        track.onended = () => {
          const localTrack = localStreamRef.current?.getVideoTracks()[0] || null
          replaceVideoTrackOnPeers(localTrack)
          if (screenVideoRef.current) screenVideoRef.current.srcObject = null
          setIsScreenSharing(false)
        }
      } catch {}
    } else {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop())
      const localTrack = localStreamRef.current?.getVideoTracks()[0] || null
      replaceVideoTrackOnPeers(localTrack)
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null
      setIsScreenSharing(false)
    }
  }

  const startRecording = () => {
    if (mediaRecorderRef.current) return
    const stream = localStreamRef.current
    if (!stream) return
    const mr = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" })
    recordedChunksRef.current = []
    mr.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `recording-${Date.now()}.webm`
      a.click()
      URL.revokeObjectURL(url)
    }
    mr.start()
    mediaRecorderRef.current = mr
  }

  const stopRecording = () => { mediaRecorderRef.current?.stop(); mediaRecorderRef.current = null }

  const handleLeave = () => { 
    info("Leave Meeting", "Are you sure you want to leave this meeting?")
    // For now, just leave directly - can add confirmation later
    router.push("/dashboard")
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const getVideoGridClass = () => {
    const totalVideos = Object.keys(peers).length + 1 + (isScreenSharing ? 1 : 0)
    if (viewMode === 'speaker') return 'grid-cols-1'
    if (totalVideos <= 2) return 'grid-cols-1 lg:grid-cols-2'
    if (totalVideos <= 4) return 'grid-cols-2'
    if (totalVideos <= 6) return 'grid-cols-2 lg:grid-cols-3'
    return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  if (!isAdminMode && !isGuestMode && loading) return (<div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>)
  if (!isAdminMode && !isGuestMode && !user) return (<div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="text-white">Redirecting to login...</div></div>)

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-lg font-semibold text-white">Meeting Room</h1>
              <p className="text-slate-400 text-sm">{Object.keys(peers).length + 1} participants • {roomCode}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="hidden md:flex items-center bg-slate-700/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'}`}
                title="Grid View"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('speaker')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'speaker' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'}`}
                title="Speaker View"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-slate-700/50 hover:bg-slate-600 text-white rounded-lg transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`p-2 rounded-lg transition-colors ${showSidebar ? 'bg-indigo-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:text-white'}`}
              title="Participants & Chat"
            >
              <Users2 className="h-4 w-4" />
            </button>

            <div className="hidden sm:flex items-center space-x-2">
              <button onClick={startRecording} className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors">
                Record
              </button>
              <button onClick={stopRecording} className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors">
                Stop
              </button>
            </div>

            <button
              onClick={() => setShowInvite(!showInvite)}
              className={`p-2 rounded-lg transition-colors ${showInvite ? 'bg-indigo-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:text-white'}`}
              title="Invite"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col bg-slate-900">
          <div className="flex-1 p-4">
            <div className={`grid gap-3 h-full ${getVideoGridClass()}`}>
              {/* Local Video */}
              <div className="relative group">
                <video 
                  ref={localVideoRef} 
                  className="w-full h-full object-cover rounded-xl bg-slate-800 shadow-lg" 
                  autoPlay 
                  playsInline 
                  muted={!micTestMode}
                />
                <div className="absolute top-3 right-3 flex space-x-1">
                  {micTestMode && (
                    <button
                      onClick={toggleMicTest}
                      className="bg-yellow-500 hover:bg-yellow-600 p-1 rounded-full transition-colors"
                      title="Mic Test Active - Click to disable"
                    >
                      <Mic className="h-3 w-3 text-white" />
                    </button>
                  )}
                  {!isAudioOn && (
                    <div className="bg-red-500 p-1 rounded-full">
                      <MicOff className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {!isVideoOn && (
                    <div className="bg-red-500 p-1 rounded-full">
                      <VideoOff className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Screen Share */}
              {isScreenSharing && (
                <div className="relative group">
                  <video 
                    ref={screenVideoRef} 
                    className="w-full h-full object-cover rounded-xl bg-slate-800 shadow-lg" 
                    autoPlay 
                    playsInline 
                  />
                </div>
              )}

              {/* Peer Videos */}
              {Object.entries(peers).map(([sid, peer]) => (
                <div key={sid} className="relative group">
                  <video 
                    ref={(el) => { if (el) peerVideoRefs.current[sid] = el }} 
                    className="w-full h-full object-cover rounded-xl bg-slate-800 shadow-lg" 
                    autoPlay 
                    playsInline 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 bg-slate-800/95 backdrop-blur-sm border-l border-slate-700/50 flex flex-col">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-slate-700/50">
              <button
                onClick={() => setActiveTab('participants')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'participants' 
                    ? 'text-white bg-slate-700/50 border-b-2 border-indigo-500' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Participants
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'chat' 
                    ? 'text-white bg-slate-700/50 border-b-2 border-indigo-500' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Chat
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'participants' && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Participants ({Object.keys(peers).length + 1})</h3>
                    <button
                      onClick={() => setShowInvite(!showInvite)}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Current User */}
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-slate-700/30">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user?.name?.charAt(0) || 'Y'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{user?.name || 'You'}</p>
                        <p className="text-slate-400 text-xs">Host</p>
                      </div>
                      <div className="flex space-x-1">
                        {!isAudioOn && <MicOff className="h-3 w-3 text-red-400" />}
                        {!isVideoOn && <VideoOff className="h-3 w-3 text-red-400" />}
                      </div>
                    </div>

                    {/* Peer Participants */}
                    {Object.entries(peers).map(([sid, peer]) => (
                      <div key={sid} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-700/20">
                        <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {peer.user?.name?.charAt(0) || 'P'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">
                            {peer.user?.name || 'Participant'}
                          </p>
                          <p className="text-slate-400 text-xs">Participant</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 p-4">
                    <div className="text-center text-slate-400 text-sm">
                      Chat feature coming soon...
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-700/50">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invite Panel */}
        {showInvite && (
          <div className="w-80 bg-slate-800/95 backdrop-blur-sm border-l border-slate-700/50 flex flex-col">
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Invite Participants</h3>
              <button
                onClick={() => setShowInvite(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* Meeting Link */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Meeting Link</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={meetingLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      copySuccess ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {copySuccess ? 'Copied!' : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              {/* Meeting ID */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Meeting ID</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={roomCode}
                    readOnly
                    className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm font-mono"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(roomCode)}
                    className="px-3 py-2 bg-slate-600/50 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Email Invite */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Invite by Email</label>
                <div className="space-y-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter email address"
                  />
                  <button
                    onClick={handleSendInvite}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </button>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const text = `Join my meeting: ${meetingLink}`
                    navigator.clipboard.writeText(text)
                    success('Invitation Copied', 'Meeting invitation copied to clipboard!')
                  }}
                  className="w-full bg-slate-600/50 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Copy Invitation Text
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls - Fixed Position */}
      <div className="bg-slate-800/95 backdrop-blur-sm border-t border-slate-700/50 p-4 flex-shrink-0">
        <div className="flex justify-center items-center space-x-3">
          <div className="relative">
            <button 
              onClick={toggleAudio} 
              className={`p-3 rounded-full transition-all duration-200 ${
                isAudioOn 
                  ? "bg-slate-700/50 hover:bg-slate-600 text-white" 
                  : "bg-red-600 hover:bg-red-700 text-white shadow-lg"
              }`}
              title={isAudioOn ? "Mute" : "Unmute"}
            >
              {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
            
            {/* Mic Test Button */}
            <button
              onClick={toggleMicTest}
              className={`absolute -top-2 -right-2 p-1 rounded-full text-xs transition-all duration-200 ${
                micTestMode 
                  ? "bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg" 
                  : "bg-slate-600/50 hover:bg-slate-500 text-slate-300"
              }`}
              title={micTestMode ? "Disable Mic Test" : "Enable Mic Test"}
            >
              🎤
            </button>
          </div>
          
          <button 
            onClick={toggleVideo} 
            className={`p-3 rounded-full transition-all duration-200 ${
              isVideoOn 
                ? "bg-slate-700/50 hover:bg-slate-600 text-white" 
                : "bg-red-600 hover:bg-red-700 text-white shadow-lg"
            }`}
            title={isVideoOn ? "Stop Video" : "Start Video"}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
          
          <button 
            onClick={startStopScreenShare} 
            className={`p-3 rounded-full transition-all duration-200 ${
              isScreenSharing 
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg" 
                : "bg-slate-700/50 hover:bg-slate-600 text-white"
            }`}
            title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
          >
            <Monitor className="h-5 w-5" />
          </button>

          <div className="h-8 w-px bg-slate-600 mx-2"></div>

          <button 
            onClick={handleLeave} 
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200 shadow-lg"
            title="Leave Meeting"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
        
        {/* Meeting Info */}
        <div className="flex justify-center mt-3">
          <div className="flex items-center space-x-3 text-sm text-slate-400">
            <span className="font-mono">{roomCode}</span>
            <span>•</span>
            <button
              onClick={handleCopyLink}
              className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center space-x-1"
            >
              <Link2 className="h-3 w-3" />
              <span>{copySuccess ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guest Name Modal */}
      {showGuestNameModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Join Meeting</h2>
            <p className="text-slate-300 mb-4">Enter your name to join the meeting</p>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && guestName.trim()) {
                  setShowGuestNameModal(false)
                }
              }}
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/')}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (guestName.trim()) {
                    setShowGuestNameModal(false)
                  }
                }}
                disabled={!guestName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Join Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
