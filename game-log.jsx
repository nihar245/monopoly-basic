"use client"

import { useEffect, useState } from "react"

export default function GameLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/get-logs")
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      } else {
        console.error("Failed to fetch logs")
      }
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    try {
      const response = await fetch("/api/clear-logs", {
        method: "DELETE"
      })
      if (response.ok) {
        setLogs([])
      }
    } catch (error) {
      console.error("Error clearing logs:", error)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="game-logs-panel">
      <div className="logs-header">
        <h2>Game Logs</h2>
        <div>
          <button onClick={fetchLogs} style={{ marginRight: "10px" }}>
            Refresh
          </button>
          <button id="clear-logs" onClick={clearLogs}>
            Clear
          </button>
        </div>
      </div>
      <div className="logs-content">
        {loading ? (
          <div>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div>No logs available</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`log-entry ${log.type || "info"}`}>
              <span className="log-timestamp">{log.timestamp || formatDate(log.date)}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}