import { useState, useRef, useEffect } from "react"
import "./App.css"

export default function App() {
  const [videoUrl, setVideoUrl] = useState("")
  const [wsUrl, setWsUrl] = useState("")
  const [activeUrl, setActiveUrl] = useState("")
  const [wsStatus, setWsStatus] = useState("idle") // idle | connecting | connected | disconnected
  const [videoStatus, setVideoStatus] = useState("idle")
  const [faceCount, setFaceCount] = useState(0)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const currentBboxes = useRef([])
  const wsRef = useRef(null)

  // ── Canvas animation loop ─────────────────────────────────
  useEffect(() => {
    let animFrame
    function draw() {
      const canvas = canvasRef.current
      const video = videoRef.current
      if (canvas && video && video.readyState >= 2) {
        canvas.width = video.clientWidth
        canvas.height = video.clientHeight
        const ctx = canvas.getContext("2d")
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const scaleX = canvas.width / (video.videoWidth || canvas.width)
        const scaleY = canvas.height / (video.videoHeight || canvas.height)

        currentBboxes.current.forEach(({ bbox, label, confidence, color }) => {
          const [x, y, w, h] = bbox
          const rx = x * scaleX
          const ry = y * scaleY
          const rw = w * scaleX
          const rh = h * scaleY

          const c = color === "green" ? "#1D9E75" : "#e74c3c"

          // box
          ctx.strokeStyle = c
          ctx.lineWidth = 2
          ctx.strokeRect(rx, ry, rw, rh)

          // label background
          const text = `${label} ${confidence > 0 ? (confidence * 100).toFixed(0) + "%" : ""}`
          ctx.font = "bold 13px monospace"
          const textWidth = ctx.measureText(text).width
          ctx.fillStyle = c
          ctx.fillRect(rx, ry - 22, textWidth + 10, 20)

          // label text
          ctx.fillStyle = "#fff"
          ctx.fillText(text, rx + 5, ry - 7)
        })
      }
      animFrame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animFrame)
  }, [])

  // ── Load video ────────────────────────────────────────────
  function loadVideo() {
    if (!videoUrl.trim()) return
    const url = videoUrl.trim().includes("ngrok")
      ? videoUrl.trim() + "?ngrok-skip-browser-warning=true"
      : videoUrl.trim()
    setActiveUrl(url)
    setVideoStatus("loading")
  }

  // ── Connect WebSocket ─────────────────────────────────────
  function connectWS() {
    if (!wsUrl.trim()) return
    if (wsRef.current) wsRef.current.close()

    setWsStatus("connecting")
    const ws = new WebSocket(wsUrl.trim())

    ws.onopen = () => {
      setWsStatus("connected")
      console.log("WebSocket connected")
    }

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        currentBboxes.current = data.faces || []
        setFaceCount(data.faces?.length || 0)
      } catch (err) {
        console.error("WS parse error:", err)
      }
    }

    ws.onclose = () => {
      setWsStatus("disconnected")
      currentBboxes.current = []
      setFaceCount(0)
    }

    ws.onerror = (e) => {
      console.error("WS error:", e)
      setWsStatus("disconnected")
    }

    wsRef.current = ws
  }

  function disconnectWS() {
    if (wsRef.current) wsRef.current.close()
    setWsStatus("idle")
    currentBboxes.current = []
    setFaceCount(0)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">⬡ VisionGate</div>
        <div className="badge">Demo</div>
        <div className="header-stats">
          {wsStatus === "connected" && (
            <span className="stat-pill green">{faceCount} face{faceCount !== 1 ? "s" : ""} detected</span>
          )}
        </div>
      </header>

      <main className="main">

        {/* Video URL */}
        <div className="section-label">Video Stream</div>
        <div className="url-bar">
          <input
            className="url-input"
            type="text"
            placeholder="https://xxx.ngrok-free.app/video.mp4"
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && loadVideo()}
          />
          <button className="btn btn-teal" onClick={loadVideo}>Load</button>
        </div>

        {/* WebSocket URL */}
        <div className="section-label">AI Engine WebSocket</div>
        <div className="url-bar">
          <input
            className="url-input"
            type="text"
            placeholder="wss://x.tcp.ngrok.io:PORT"
            value={wsUrl}
            onChange={e => setWsUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && connectWS()}
          />
          {wsStatus !== "connected"
            ? <button className="btn btn-purple" onClick={connectWS}>Connect</button>
            : <button className="btn btn-outline" onClick={disconnectWS}>Disconnect</button>
          }
        </div>

        {/* Status row */}
        <div className="status-row">
          <div className={"status-pill status-" + videoStatus}>
            {videoStatus === "idle"    && "No video"}
            {videoStatus === "loading" && "⏳ Loading video..."}
            {videoStatus === "playing" && "🟢 Video live"}
            {videoStatus === "error"   && "🔴 Video error"}
          </div>
          <div className={"status-pill status-" + wsStatus}>
            {wsStatus === "idle"        && "WS idle"}
            {wsStatus === "connecting"  && "⏳ WS connecting..."}
            {wsStatus === "connected"   && "🟢 WS connected"}
            {wsStatus === "disconnected"&& "🔴 WS disconnected"}
          </div>
        </div>

        {/* Player */}
        <div className="player-wrap">
          {!activeUrl && (
            <div className="placeholder">
              <div className="placeholder-icon">📡</div>
              <div>Paste video URL above and click Load</div>
            </div>
          )}
          {activeUrl && (
            <>
              <video
                ref={videoRef}
                className="video"
                src={activeUrl}
                onCanPlay={() => setVideoStatus("playing")}
                onError={() => setVideoStatus("error")}
                autoPlay
                loop
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="canvas" />
            </>
          )}
        </div>

      </main>
    </div>
  )
}
