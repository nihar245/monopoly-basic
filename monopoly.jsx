"use client"
import GameLogs from './game-logs';
import React, { useState, useEffect, createContext, useContext, useCallback } from "react"
import ReactDOM from "react-dom/client"
import { motion, AnimatePresence } from "framer-motion"

const GameContext = createContext()
const useGame = () => useContext(GameContext)

const NotificationContext = createContext()
const useNotifications = () => useContext(NotificationContext)

const boardSpaces = [
  { position: 0, type: "corner", name: "GO", className: "go" },
  { position: 1, type: "property", name: "Mumbai", price: 6000, rent: 600, color: "brown" },
  { position: 2, type: "community-chest", name: "Community Chest" },
  { position: 3, type: "property", name: "Delhi", price: 5500, rent: 550, color: "brown" },
  { position: 4, type: "tax", name: "Income Tax" },
  { position: 5, type: "railroad", name: "Western Railway", price: 2500, rent: 250, color: "black" },
  { position: 6, type: "property", name: "Kolkata", price: 4000, rent: 400, color: "light-blue" },
  { position: 7, type: "corner", name: "Jail", className: "jail" },
  { position: 8, type: "jail-location", name: "JAIL" },
  { position: 9, type: "chance", name: "Chance" },
  { position: 10, type: "property", name: "Chennai", price: 3500, rent: 350, color: "light-blue" },
  { position: 11, type: "railroad", name: "Central Railway", price: 2500, rent: 250, color: "black" },
  { position: 12, type: "property", name: "Bangalore", price: 4500, rent: 450, color: "pink" },
  { position: 13, type: "utility", name: "Electric Company", price: 1500, rent: 150, color: "silver" },
  { position: 14, type: "corner", name: "Free Parking", className: "free-parking" },
  { position: 15, type: "property", name: "Hyderabad", price: 4200, rent: 420, color: "pink" },
  { position: 16, type: "property", name: "Ahmedabad", price: 3000, rent: 300, color: "pink" },
  { position: 17, type: "railroad", name: "Northern Railway", price: 2500, rent: 250, color: "black" },
  { position: 18, type: "property", name: "Pune", price: 2800, rent: 280, color: "orange" },
  { position: 19, type: "community-chest", name: "Community Chest" },
  { position: 20, type: "property", name: "Surat", price: 2500, rent: 250, color: "orange" },
  { position: 21, type: "corner", name: "Go To Jail", className: "go-to-jail" },
  { position: 22, type: "property", name: "Jaipur", price: 2200, rent: 220, color: "orange" },
  { position: 23, type: "chance", name: "Chance" },
  { position: 24, type: "property", name: "Lucknow", price: 2000, rent: 200, color: "red" },
  { position: 25, type: "property", name: "Chandigarh", price: 1800, rent: 180, color: "red" },
  { position: 26, type: "utility", name: "Water Works", price: 1500, rent: 150, color: "silver" },
  { position: 27, type: "property", name: "Bhopal", price: 1500, rent: 150, color: "red" },
  { position: 28, type: "property", name: "Indore", price: 1200, rent: 120, color: "yellow" },
]

const initialPlayers = [
  { id: 1, name: "Player 1", color: "#FF0000", position: 0, money: 15000, properties: [] },
  { id: 2, name: "Player 2", color: "#0000FF", position: 0, money: 15000, properties: [] },
  { id: 3, name: "Player 3", color: "#008000", position: 0, money: 15000, properties: [] },
  { id: 4, name: "Player 4", color: "#FFA500", position: 0, money: 15000, properties: [] },
]

const propertyGroups = {
  brown: [1, 3],
  lightBlue: [6, 10],
  pink: [12, 15, 16],
  orange: [18, 20, 22],
  red: [24, 25, 27],
  yellow: [28],
}

// API functions
const sendLogToServer = async (logData) => {
  try {
    const response = await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    })
    return await response.json()
  } catch (error) {
    console.error("Error sending log to server:", error)
  }
}

const saveGameState = async (gameState) => {
  try {
    const response = await fetch("/api/save-game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gameState),
    })
    return await response.json()
  } catch (error) {
    console.error("Error saving game state:", error)
  }
}

const loadSavedGame = async (gameId) => {
  try {
    const response = await fetch(`/api/load-game/${gameId}`)
    return await response.json()
  } catch (error) {
    console.error("Error loading saved game:", error)
    return null
  }
}

// Notification Component
const SquareNotification = ({ notification, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`square-notification ${notification.type}`}
      style={{
        position: "absolute",
        bottom: "5px",
        left: "5px",
        right: "5px",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "6px 8px",
        borderRadius: "4px",
        fontSize: "10px",
        maxWidth: "90%",
        zIndex: 10,
        backdropFilter: "blur(2px)",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{notification.message}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "white",
          cursor: "pointer",
          padding: "2px",
          marginLeft: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </motion.div>
  )
}

const PlayerToken = ({ player }) => {
  return (
    <div className="player-token" style={{ backgroundColor: player.color }}>
      {player.id}
    </div>
  )
}

const Space = ({ space, children }) => {
  const { getPropertyOwner } = useGame()
  const { notifications, addNotification, removeNotification } = useNotifications()
  const { position, type, name, price, rent, color, className } = space

  const owner = getPropertyOwner(position)
  const spaceNotifications = notifications.filter((n) => n.position === position)

  let spaceClasses = `space ${type}`
  if (className) spaceClasses += ` ${className}`
  if (color) spaceClasses += ` ${color}`

  const renderContent = () => {
    if (
      type === "corner" ||
      type === "chance" ||
      type === "community-chest" ||
      type === "tax" ||
      type === "jail-location"
    ) {
      return <div className="name">{name}</div>
    }

    return (
      <div className="content">
        <div className="name">{name}</div>
        {price && <div className="price">₹{price}</div>}
        {rent && <div className="rent">Rent: ₹{rent}</div>}
      </div>
    )
  }

  useEffect(() => {
    if (position === 0 && type === "corner") {
      const timer = setTimeout(() => {
        addNotification("Welcome to Monopoly!", 0, "info", 6000)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [position, type, addNotification])

  return (
    <div className={spaceClasses} data-position={position}>
      {renderContent()}
      {owner && <div className="owner-indicator" style={{ backgroundColor: owner.color }}></div>}
      {children}

      {/* Notifications */}
      <AnimatePresence>
        {spaceNotifications.map((notification) => (
          <SquareNotification
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

const PropertyPurchasePopup = () => {
  const { players, currentPlayerIndex, propertyToBuy, buyProperty, passOnProperty } = useGame()

  if (!propertyToBuy) return null

  const currentPlayer = players[currentPlayerIndex]

  return (
    <div className="property-popup">
      <div className="property-popup-header">
        <h3>Property Purchase</h3>
      </div>
      <div className="property-popup-content">
        <p>
          {currentPlayer.name}, would you like to buy {propertyToBuy.name} for ₹{propertyToBuy.price}?
        </p>
        <p>Rent: ₹{propertyToBuy.rent}</p>
        <p>Your current balance: ₹{currentPlayer.money}</p>
      </div>
      <div className="property-popup-actions">
        <button className="buy-property" onClick={buyProperty}>
          Buy
        </button>
        <button className="ignore-property" onClick={passOnProperty}>
          Pass
        </button>
      </div>
    </div>
  )
}

const PropertyOwnership = () => {
  const { players, properties } = useGame()

  return (
    <div className="property-ownership-corner">
      <h3 className="ownership-title">Property Ownership</h3>
      <div className="ownership-content" id="ownership-content">
        {players.map((player) => {
          const ownedProperties = properties.filter((property) => player.properties.includes(property.position))

          return (
            <div key={player.id} className="player-ownership">
              <div className="player-header" style={{ backgroundColor: player.color }}>
                <span className="player-name">{player.name}</span>
                <span className="property-count">{ownedProperties.length} properties</span>
              </div>
              <div className="owned-properties-list">
                {ownedProperties.length > 0 ? (
                  ownedProperties.map((property) => (
                    <div key={property.position} className="owned-property">
                      <span className="property-color" style={{ backgroundColor: property.color }}></span>
                      <span className="property-name">{property.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-properties">No properties owned</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const Controls = () => {
  const { players, currentPlayerIndex, diceValue, isRolling, isProcessingTurn, rollDice, showPropertyPopup, saveGame } =
    useGame()

  const currentPlayer = players[currentPlayerIndex]

  return (
    <div className="game-controls">
      <div className="dice-container">
        <div className="dice" id="dice">
          {diceValue}
        </div>
      </div>
      <button id="roll-dice" onClick={rollDice} disabled={isRolling || isProcessingTurn}>
        Roll Dice
      </button>
      <button id="save-game" onClick={saveGame} disabled={isProcessingTurn}>
        Save Game
      </button>
      <div className="player-info">
        <h3>
          Current Turn:{" "}
          <span id="current-player" style={{ color: currentPlayer.color }}>
            {currentPlayer.name}
          </span>
        </h3>
        <div id="player-stats">
          {players.map((player) => (
            <div key={player.id} className="player-stat">
              <div className="player-color" style={{ background: player.color }}></div>
              {player.name}: ₹{player.money} ({player.properties.length} properties)
            </div>
          ))}
        </div>
      </div>

      {showPropertyPopup && <PropertyPurchasePopup />}
    </div>
  )
}

// Board Component
const Board = () => {
  const { players, initializeProperties } = useGame()

  useEffect(() => {
    initializeProperties(boardSpaces)
  }, [initializeProperties])

  return (
    <div className="board">
      {boardSpaces.map((space) => (
        <Space key={space.position} space={space}>
          {players.map(
            (player) => player.position === space.position && <PlayerToken key={player.id} player={player} />,
          )}
        </Space>
      ))}
    </div>
  )
}

// Notification Provider Component
const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  // Add a notification
  const addNotification = useCallback((message, position, type = "info", duration = 5000) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const newNotification = {
      id,
      message,
      type,
      position,
      timestamp: Date.now(),
    }

    setNotifications((prev) => [...prev, newNotification])

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
  }, [])

  // Remove a notification
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  // Clean up old notifications (older than 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setNotifications((prev) => prev.filter((notification) => now - notification.timestamp < 30000))
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const value = {
    notifications,
    addNotification,
    removeNotification,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

// Game Provider Component
const GameProvider = ({ children }) => {
  const [players, setPlayers] = useState(initialPlayers)
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [diceValue, setDiceValue] = useState(1)
  const [isRolling, setIsRolling] = useState(false)
  const [isProcessingTurn, setIsProcessingTurn] = useState(false)
  const [properties, setProperties] = useState([])
  const [showPropertyPopup, setShowPropertyPopup] = useState(false)
  const [propertyToBuy, setPropertyToBuy] = useState(null)
  const [gameLogs, setGameLogs] = useState([])

  // Remove this line: const { addNotification } = useNotifications()

  // Create a local function to be passed down through context
  const showNotification = useCallback((message, position, type, duration) => {
    // We'll access the actual addNotification function when it's available
    // This will be called by components that have access to both contexts
  }, [])

  // Add a game log
  const addGameLog = useCallback((message, type = "info") => {
    const now = new Date()
    const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`

    const logEntry = {
      timestamp,
      message,
      type,
      date: now.toISOString(),
    }

    setGameLogs((prevLogs) => [...prevLogs, logEntry])

    // Send log to server
    sendLogToServer(logEntry)
  }, [])

  const fetchGameLogs = useCallback(async () => {
    try {
      const response = await fetch("/api/get-logs")
      const logs = await response.json()
      setGameLogs(logs)
    } catch (error) {
      console.error("Error fetching logs:", error)
      // Fallback to local logs if API fails
    }
  }, [])

  // Initialize properties from board spaces
  const initializeProperties = useCallback((spaces) => {
    const newProperties = []

    spaces.forEach((space) => {
      if (space.type === "property" || space.type === "railroad" || space.type === "utility") {
        newProperties.push({
          position: space.position,
          name: space.name,
          price: space.price,
          rent: space.rent,
          color: space.color,
        })
      }
    })

    setProperties(newProperties)
  }, [])

  // Get property owner
  const getPropertyOwner = useCallback(
    (position) => {
      return players.find((player) => player.properties.includes(position)) || null
    },
    [players],
  )

  // Roll dice
  const rollDice = useCallback(() => {
    if (isProcessingTurn) return

    setIsProcessingTurn(true)
    setIsRolling(true)

    let rollCount = 0
    const maxRolls = 15
    const rollInterval = setInterval(() => {
      const randomValue = Math.floor(Math.random() * 6) + 1
      setDiceValue(randomValue)

      if (++rollCount >= maxRolls) {
        clearInterval(rollInterval)
        setIsRolling(false)

        const currentPlayer = players[currentPlayerIndex]
        addGameLog(`${currentPlayer.name} rolled a ${randomValue}`, "dice")

        movePlayer(currentPlayer, randomValue)
      }
    }, 100)
  }, [isProcessingTurn, players, currentPlayerIndex, addGameLog])

  // Move player
  const movePlayer = useCallback(
    (player, steps) => {
      let stepsMoved = 0
      let currentPosition = player.position

      const moveStep = () => {
        if (stepsMoved < steps) {
          const nextPosition = (currentPosition + 1) % 29
          currentPosition = nextPosition

          // Update player position
          setPlayers((prevPlayers) =>
            prevPlayers.map((p) => (p.id === player.id ? { ...p, position: nextPosition } : p)),
          )

          // Check if passed GO
          if (nextPosition === 0) {
            setPlayers((prevPlayers) =>
              prevPlayers.map((p) => (p.id === player.id ? { ...p, money: p.money + 2000 } : p)),
            )
            addGameLog(`${player.name} collected ₹2000 for passing GO!`, "payment")
            // We'll handle notifications in the components that use this data
          }

          stepsMoved++

          if (stepsMoved < steps) {
            setTimeout(moveStep, 300)
          } else {
            // Show notification on the space where player landed
            // We'll handle notifications in the components that use this data
            handleLanding(nextPosition)
          }
        }
      }

      moveStep()
    },
    [addGameLog],
  )

  // Handle landing on a space
  const handleLanding = useCallback(
    (position) => {
      const currentPlayer = players[currentPlayerIndex]

      // Handle special spaces
      if (position === 21) {
        // Go to jail
        addGameLog(`${currentPlayer.name} landed on Go To Jail!`, "info")
        // We'll handle notifications in the components that use this data

        setTimeout(() => {
          setPlayers((prevPlayers) => prevPlayers.map((p) => (p.id === currentPlayer.id ? { ...p, position: 8 } : p)))
          addGameLog(`${currentPlayer.name} was sent to Jail`, "info")
          // We'll handle notifications in the components that use this data
          endTurn()
        }, 1000)
        return
      } else if (position === 4) {
        // Income tax
        const tax = Math.min(200, Math.floor(currentPlayer.money * 0.1))
        setPlayers((prevPlayers) =>
          prevPlayers.map((p) => (p.id === currentPlayer.id ? { ...p, money: p.money - tax } : p)),
        )
        addGameLog(`${currentPlayer.name} paid $${tax} in income tax`, "payment")
        // We'll handle notifications in the components that use this data
        endTurn()
        return
      } else if (position === 2 || position === 19) {
        // Community Chest
        const moneyAmount = Math.floor(Math.random() * 150) + 50
        setPlayers((prevPlayers) =>
          prevPlayers.map((p) => (p.id === currentPlayer.id ? { ...p, money: p.money + moneyAmount } : p)),
        )
        addGameLog(`${currentPlayer.name} drew a Community Chest card and received $${moneyAmount}!`, "money")
        // We'll handle notifications in the components that use this data
        endTurn()
        return
      } else if (position === 9 || position === 23) {
        // Chance
        const moneyAmount = Math.floor(Math.random() * 200) + 25
        setPlayers((prevPlayers) =>
          prevPlayers.map((p) => (p.id === currentPlayer.id ? { ...p, money: p.money + moneyAmount } : p)),
        )
        addGameLog(`${currentPlayer.name} drew a Chance card and received $${moneyAmount}!`, "money")
        // We'll handle notifications in the components that use this data
        endTurn()
        return
      }

      // Check for property purchase
      const property = properties.find((p) => p.position === position)
      if (property) {
        const owner = getPropertyOwner(position)

        if (owner) {
          if (owner.id !== currentPlayer.id) {
            // Pay rent
            const rent = property.rent
            setPlayers((prevPlayers) =>
              prevPlayers.map((p) => {
                if (p.id === currentPlayer.id) {
                  return { ...p, money: p.money - rent }
                } else if (p.id === owner.id) {
                  return { ...p, money: p.money + rent }
                }
                return p
              }),
            )
            addGameLog(`${currentPlayer.name} paid $${rent} rent to ${owner.name} for ${property.name}`, "payment")
            // We'll handle notifications in the components that use this data
          } else {
            addGameLog(`${currentPlayer.name} owns this property already.`, "info")
            // We'll handle notifications in the components that use this data
          }
          endTurn()
        } else {
          // Offer to buy
          if (currentPlayer.money >= property.price) {
            setPropertyToBuy(property)
            setShowPropertyPopup(true)
          } else {
            addGameLog(`${currentPlayer.name} doesn't have enough money to buy this property!`, "info")
            // We'll handle notifications in the components that use this data
            endTurn()
          }
        }
      } else {
        endTurn()
      }
    },
    [players, currentPlayerIndex, properties, getPropertyOwner, addGameLog],
  )

  // Buy property
  const buyProperty = useCallback(() => {
    if (!propertyToBuy) return

    const currentPlayer = players[currentPlayerIndex]

    setPlayers((prevPlayers) =>
      prevPlayers.map((p) =>
        p.id === currentPlayer.id
          ? {
              ...p,
              money: p.money - propertyToBuy.price,
              properties: [...p.properties, propertyToBuy.position],
            }
          : p,
      ),
    )

    addGameLog(`${currentPlayer.name} bought ${propertyToBuy.name} for $${propertyToBuy.price}`, "property")
    // We'll handle notifications in the components that use this data

    setShowPropertyPopup(false)
    setPropertyToBuy(null)

    // Check for monopoly
    setTimeout(() => {
      checkForMonopoly(currentPlayer.id)
      endTurn()
    }, 500)
  }, [propertyToBuy, players, currentPlayerIndex, addGameLog])

  // Pass on buying property
  const passOnProperty = useCallback(() => {
    if (!propertyToBuy) return

    const currentPlayer = players[currentPlayerIndex]
    addGameLog(`${currentPlayer.name} decided not to buy ${propertyToBuy.name}`, "info")
    // We'll handle notifications in the components that use this data

    setShowPropertyPopup(false)
    setPropertyToBuy(null)
    endTurn()
  }, [propertyToBuy, players, currentPlayerIndex, addGameLog])

  // Check for monopoly
  const checkForMonopoly = useCallback(
    (playerId) => {
      const player = players.find((p) => p.id === playerId)
      if (!player) return

      for (const [groupName, positions] of Object.entries(propertyGroups)) {
        const ownsAll = positions.every((position) => player.properties.includes(position))

        if (ownsAll) {
          addGameLog(`${player.name} now has a monopoly on the ${groupName} properties!`, "property")

          // Show notification on each property in the monopoly
          positions.forEach((position) => {
            // We'll handle notifications in the components that use this data
          })
        }
      }
    },
    [players, addGameLog],
  )

  // End turn
  const endTurn = useCallback(() => {
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length)
    setIsProcessingTurn(false)
  }, [players.length])

  // Save game
  const saveGame = useCallback(() => {
    const gameState = {
      gameId: Date.now().toString(),
      players,
      currentPlayerIndex,
      properties,
    }

    saveGameState(gameState).then((response) => {
      if (response.success) {
        addGameLog(`Game saved successfully! Game ID: ${response.gameId}`, "system")
      }
    })
  }, [players, currentPlayerIndex, properties, addGameLog])

  // Initialize game
  useEffect(() => {
    addGameLog("Game started! Welcome to Monopoly!", "system")
  }, [addGameLog])

  const value = {
    players,
    setPlayers,
    currentPlayerIndex,
    diceValue,
    isRolling,
    isProcessingTurn,
    properties,
    showPropertyPopup,
    propertyToBuy,
    gameLogs,
    rollDice,
    getPropertyOwner,
    buyProperty,
    passOnProperty,
    initializeProperties,
    addGameLog,
    saveGame,
    showNotification,
    fetchGameLogs,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

// Main App Component
const App = () => {
  return (
    <GameProvider>
      <NotificationProvider>
        <div className="app-container">
          <h1 className="game-title">MONOPOLY</h1>
          <div className="game-layout">
            <PropertyOwnership />
            <Board />
            <Controls />
            <GameLogs />
          </div>
        </div>
      </NotificationProvider>
    </GameProvider>
  );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

