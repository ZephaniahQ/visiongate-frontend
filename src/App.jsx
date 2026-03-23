import { useState, useRef } from "react"
import "./App.css"

export default function App() {
  const [videoUrl, setVideoUrl] = useState("")
  const [activeUrl, setActiveUrl] = useState("")
  const [status, setStatus] = useState("idle")
  const videoRef = useRef(null)

  // function load() {
  //   if (!videoUrl.trim()) return
  //   setActiveUrl(videoUrl.trim())
  //   setStatus("loading")
  // }


    // async function load() {
    //     if (!videoUrl.trim()) return
    //     setStatus("loading")
    //     try {
    //         const res = await fetch(videoUrl.trim(), {
    //             headers: { "ngrok-skip-browser-warning": "true" }
    //         })
    //         if (!res.ok) throw new Error("HTTP " + res.status)
    //         const blob = await res.blob()
    //         const blobUrl = URL.createObjectURL(blob)
    //         setActiveUrl(blobUrl)
    //     } catch (err) {
    //         console.error(err)
    //         setStatus("error")
    //     }
    // }
    //
        async function load() {
            if (!videoUrl.trim()) return
            setStatus("loading")
            // append ngrok bypass param if it's an ngrok URL
            const url = videoUrl.trim().includes("ngrok")
                ? videoUrl.trim() + "?ngrok-skip-browser-warning=true"
                : videoUrl.trim()
            setActiveUrl(url)
        }


  function onCanPlay() {
    setStatus("playing")
    videoRef.current?.play()
  }

  function onError() {
    setStatus("error")
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">⬡ VisionGate</div>
        <div className="badge">Demo</div>
      </header>

      <main className="main">
        <div className="url-bar">
          <input
            className="url-input"
            type="text"
            placeholder="Paste ngrok HTTP video URL — https://xxx.ngrok-free.app/video.mp4"
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load()}
          />
          <button className="btn-load" onClick={load}>Load</button>
        </div>

        {status !== "idle" && (
          <div className={"status-pill status-" + status}>
            {status === "loading" && "Connecting..."}
            {status === "playing" && "Live"}
            {status === "error"   && "Could not load — check URL and that stream.sh is running"}
          </div>
        )}

        <div className="player-wrap">
          {!activeUrl && (
            <div className="placeholder">
              <div className="placeholder-icon">📡</div>
              <div>Paste your ngrok video URL above and click Load</div>
            </div>
          )}
          {activeUrl && (
            <>
              <video
                ref={videoRef}
                className="video"
                src={activeUrl}
                onCanPlay={onCanPlay}
                onError={onError}
                autoPlay
                loop
                muted
                playsInline
              />
              <canvas className="canvas" />
            </>
          )}
        </div>

        {status === "playing" && (
          <div className="info-row">
            <span className="info-item">Stream: {activeUrl}</span>
          </div>
        )}
      </main>
    </div>
  )
}
