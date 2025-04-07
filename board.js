document.addEventListener("DOMContentLoaded", () => {
  const spaces = document.querySelectorAll(".space")
  const players = [
    { id: 1, name: "Player 1", color: "#FF0000", position: 0, money: 15000, properties: [] },
    { id: 2, name: "Player 2", color: "#0000FF", position: 0, money: 15000, properties: [] },
    { id: 3, name: "Player 3", color: "#008000", position: 0, money: 15000, properties: [] },
    { id: 4, name: "Player 4", color: "#FFA500", position: 0, money: 15000, properties: [] },
  ]

  // Define property groups for monopoly bonuses
  const propertyGroups = {
    brown: [1, 3],
    lightBlue: [6, 10], // Removed position 8 (Vermont Avenue) as it's now jail
    pink: [12, 15, 16],
    orange: [18, 20, 22],
    red: [24, 25, 27],
    yellow: [28],
  }

  let currentPlayerIndex = 0
  let propertyPopup = null
  let actionPopup = null
  let isProcessingTurn = false

  // Create a properties array with all property details
  const properties = []

  // Create an array to store game logs
  const gameLogs = []

  // Define special action messages for different spaces
  const specialActionMessages = {
    // Corner spaces
    0: { title: "GO!", message: "You passed GO and collected ₹2000!", type: "success" },
    7: { title: "Just Visiting", message: "You're just visiting the jail. No worries!", type: "info" },
    14: { title: "Free Parking", message: "Take a break and enjoy free parking!", type: "info" },
    21: { title: "Go To Jail", message: "Oh no! You're being sent to jail!", type: "warning" },

    // Jail location
    8: {
      title: "In Jail",
      message: "You're in jail. You'll need to pay ₹500 to get out on your next turn.",
      type: "warning",
    },

    // Chance spaces
    9: { title: "Chance", message: "Drawing a chance card...", type: "info" },
    23: { title: "Chance", message: "Drawing a chance card...", type: "info" },

    // Community Chest spaces
    2: { title: "Community Chest", message: "Drawing a community chest card...", type: "info" },
    19: { title: "Community Chest", message: "Drawing a community chest card...", type: "info" },

    // Tax space
    4: {
      title: "Income Tax",
      message: "You must pay income tax: 10% of your money or ₹2000, whichever is less.",
      type: "warning",
    },
  }

  function initializeBoard() {
    spaces.forEach((space, index) => {
      if (index >= 4) {
        if (index <= 9) space.style.setProperty("--col-position", (index - 2).toString())
        else if (index <= 15) space.style.setProperty("--row-position", (index - 9).toString())
        else if (index <= 21) space.style.setProperty("--col-position", (7 - (index - 16)).toString())
        else space.style.setProperty("--row-position", (7 - (index - 22)).toString())
      }

      if (space.classList.contains("property")) {
        const groupIndicator = document.createElement("div")
        groupIndicator.className = "property-group"
        space.appendChild(groupIndicator)

        const position = Number.parseInt(space.getAttribute("data-position"))
        const name = space.querySelector(".name")?.textContent || "Property"
        const price = Number.parseInt(space.getAttribute("data-price")) || 0
        const rent = Number.parseInt(space.getAttribute("data-rent")) || 0

        let color = "gray"
        for (const colorClass of space.classList) {
          if (colorClass !== "space" && colorClass !== "property") {
            color = colorClass
            break
          }
        }

        properties.push({
          position,
          name,
          price,
          rent,
          color,
        })
      }

      if (space.classList.contains("railroad") || space.classList.contains("utility")) {
        const position = Number.parseInt(space.getAttribute("data-position"))
        const name = space.querySelector(".name")?.textContent || "Property"
        const price = Number.parseInt(space.getAttribute("data-price")) || 0
        const rent = Number.parseInt(space.getAttribute("data-rent")) || 0
        const color = space.classList.contains("railroad") ? "black" : "silver"

        properties.push({
          position,
          name,
          price,
          rent,
          color,
        })
      }

      space.addEventListener("mouseover", function () {
        const name = this.querySelector(".name")?.textContent
        const price = this.querySelector(".price")?.textContent
        const rent = this.querySelector(".rent")?.textContent

        if (name) {
          const tooltip = document.createElement("div")
          tooltip.className = "tooltip"
          tooltip.style.cssText =
            "position:absolute;background:rgba(0,0,0,0.8);color:white;padding:5px;border-radius:3px;font-size:14px;z-index:1000"

          let tooltipContent = `<strong>${name}</strong>`
          if (price) tooltipContent += `<br>${price}`
          if (rent) tooltipContent += `<br>${rent}`

          const position = Number.parseInt(this.getAttribute("data-position"))
          const owner = getPropertyOwner(position)
          if (owner) {
            tooltipContent += `<br>Owner: ${owner.name}`
          }

          tooltip.innerHTML = tooltipContent
          document.body.appendChild(tooltip)
          const rect = this.getBoundingClientRect()
          tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`
          tooltip.style.left = `${rect.left + (rect.width - tooltip.offsetWidth) / 2}px`
          this.addEventListener("mouseout", () => tooltip.remove(), { once: true })
        }
      })
    })

    createPropertyOwnershipCorner()
  }

  function createPropertyOwnershipCorner() {
    const ownershipCorner = document.createElement("div")
    ownershipCorner.className = "property-ownership-corner"
    ownershipCorner.innerHTML = `
      <h3 class="ownership-title">Property Ownership</h3>
      <div class="ownership-content" id="ownership-content">
        ${players
          .map(
            (player) => `
          <div class="player-ownership">
            <div class="player-header" style="background-color: ${player.color}">
              <span class="player-name">${player.name}</span>
              <span class="property-count">0 properties</span>
            </div>
            <div class="owned-properties-list">
              <div class="no-properties">No properties owned</div>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `
    document.body.appendChild(ownershipCorner)

    ownershipCorner.style.position = "fixed"
    ownershipCorner.style.top = "20px"
    ownershipCorner.style.left = "20px"
    ownershipCorner.style.zIndex = "100"

    makeDraggable(ownershipCorner)
  }

  function makeDraggable(element) {
    let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0
    const header = element.querySelector(".ownership-title")

    if (header) {
      header.style.cursor = "move"
      header.onmousedown = dragMouseDown
    } else {
      element.onmousedown = dragMouseDown
    }

    function dragMouseDown(e) {
      e = e || window.event
      e.preventDefault()
      pos3 = e.clientX
      pos4 = e.clientY
      document.onmouseup = closeDragElement
      document.onmousemove = elementDrag
    }

    function elementDrag(e) {
      e = e || window.event
      e.preventDefault()
      pos1 = pos3 - e.clientX
      pos2 = pos4 - e.clientY
      pos3 = e.clientX
      pos4 = e.clientY
      element.style.top = element.offsetTop - pos2 + "px"
      element.style.left = element.offsetLeft - pos1 + "px"
    }

    function closeDragElement() {
      document.onmouseup = null
      document.onmousemove = null
    }
  }

  function updatePropertyOwnershipCorner() {
    const ownershipContent = document.getElementById("ownership-content")
    if (!ownershipContent) return

    ownershipContent.innerHTML = players
      .map((player) => {
        const ownedProperties = properties.filter((property) => player.properties.includes(property.position))

        return `
        <div class="player-ownership">
          <div class="player-header" style="background-color: ${player.color}">
            <span class="player-name">${player.name}</span>
            <span class="property-count">${ownedProperties.length} properties</span>
          </div>
          <div class="owned-properties-list">
            ${
              ownedProperties.length > 0
                ? ownedProperties
                    .map(
                      (property) => `
                <div class="owned-property">
                  <span class="property-color" style="background-color: ${property.color}"></span>
                  <span class="property-name">${property.name}</span>
                </div>
              `,
                    )
                    .join("")
                : '<div class="no-properties">No properties owned</div>'
            }
          </div>
        </div>
      `
      })
      .join("")
  }

  function createDiceUI() {
    const controls = document.createElement("div")
    controls.className = "game-controls"
    controls.innerHTML = `
      <div class="dice-container">
        <div class="dice" id="dice">1</div>
      </div>
      <button id="roll-dice">Roll Dice</button>
      <div class="player-info">
        <h3>Current Turn: <span id="current-player">Player 1</span></h3>
        <div id="player-stats"></div>
      </div>
    `
    document.body.appendChild(controls)
    document.getElementById("roll-dice").addEventListener("click", rollDice)
    updatePlayerStats()
  }

  function createPlayerTokens() {
    players.forEach((player) => {
      const token = document.createElement("div")
      token.className = "player-token"
      token.id = `player-${player.id}`
      token.style.backgroundColor = player.color
      token.textContent = player.id
      document.querySelector(`.space[data-position="${player.position}"]`).appendChild(token)
    })
  }

  function updatePlayerStats() {
    const statsContainer = document.getElementById("player-stats")
    statsContainer.innerHTML = players
      .map((player) => {
        const propertyCount = player.properties.length
        return `
        <div class="player-stat">
          <div class="player-color" style="background:${player.color}"></div>
          ${player.name}: ₹${player.money} (${propertyCount} properties)
        </div>
      `
      })
      .join("")

    const currentPlayer = players[currentPlayerIndex]
    document.getElementById("current-player").textContent = currentPlayer.name
    document.getElementById("current-player").style.color = currentPlayer.color
  }

  function rollDice() {
    if (isProcessingTurn) return

    isProcessingTurn = true
    const rollButton = document.getElementById("roll-dice")
    rollButton.disabled = true
    const currentPlayer = players[currentPlayerIndex]
    let rollCount = 0
    const maxRolls = 15
    let finalDiceValue = 0

    const rollInterval = setInterval(() => {
      const randomValue = Math.floor(Math.random() * 6) + 1
      document.getElementById("dice").textContent = randomValue

      if (++rollCount >= maxRolls) {
        clearInterval(rollInterval)
        finalDiceValue = randomValue
        document.getElementById("dice").textContent = finalDiceValue

        addGameLog(`${currentPlayer.name} rolled a ${finalDiceValue}`, "dice")

        movePlayerStepByStep(currentPlayer, finalDiceValue, () => {
          checkPropertyPurchase(currentPlayer)
        })
      }
    }, 100)
  }

  function movePlayerStepByStep(player, steps, callback) {
    let stepsMoved = 0
    const token = document.getElementById(`player-${player.id}`)

    function moveSingleStep() {
      if (stepsMoved < steps) {
        const nextPosition = (player.position + 1) % 28

        if (token.parentNode) {
          token.parentNode.removeChild(token)
        }

        const nextSpace = document.querySelector(`.space[data-position="${nextPosition}"]`)
        nextSpace.appendChild(token)

        player.position = nextPosition

        if (player.position === 0) {
          player.money += 2000
          addGameLog(`${player.name} collected ₹2000 for passing GO!`, "payment")
          updatePlayerStats()
        }

        stepsMoved++

        if (stepsMoved < steps) {
          setTimeout(moveSingleStep, 300)
        } else {
          handleSpecialSpaces(player)
          if (callback) callback()
        }
      }
    }

    moveSingleStep()
  }

  function handleSpecialSpaces(player) {
    const position = player.position

    // Show action notification for the space
    if (specialActionMessages[position]) {
      showActionNotification(player, position)
    }

    if (position === 21) {
      addGameLog(`${player.name} landed on Go To Jail!`, "info")
      setTimeout(() => {
        movePlayerToJail(player)
        addGameLog(`${player.name} was sent to Jail`, "info")
      }, 1000)
    } else if (position === 4) {
      const tax = Math.min(2000, Math.floor(player.money * 0.1))
      player.money -= tax
      addGameLog(`${player.name} paid ₹${tax} in income tax`, "payment")
    } else if (position === 2 || position === 19) {
      // Community Chest
      const moneyAmount = Math.floor(Math.random() * 1500) + 500 // Random amount between 500 and 2000
      player.money += moneyAmount

      // Update the action notification with the actual amount
      if (actionPopup) {
        const contentDiv = actionPopup.querySelector(".action-popup-content p")
        if (contentDiv) {
          contentDiv.textContent = `You drew a Community Chest card and received ₹${moneyAmount}!`
        }
      }

      addGameLog(`${player.name} drew a Community Chest card and received ₹${moneyAmount}!`, "money")
    } else if (position === 9 || position === 23) {
      // Chance
      const moneyAmount = Math.floor(Math.random() * 2000) + 250 // Random amount between 250 and 2250
      player.money += moneyAmount

      if (actionPopup) {
        const contentDiv = actionPopup.querySelector(".action-popup-content p")
        if (contentDiv) {
          contentDiv.textContent = `You drew a Chance card and received ₹${moneyAmount}!`
        }
      }

      addGameLog(`${player.name} drew a Chance card and received ₹${moneyAmount}!`, "money")
    }
    updatePlayerStats()
  }

  function showActionNotification(player, position) {
    if (actionPopup) {
      document.body.removeChild(actionPopup)
    }

    const actionInfo = specialActionMessages[position]

    actionPopup = document.createElement("div")
    actionPopup.className = "property-popup action-popup"

    if (actionInfo.type) {
      actionPopup.classList.add(`action-popup-${actionInfo.type}`)
    }

    actionPopup.innerHTML = `
      <div class="property-popup-header">
        <h3>${actionInfo.title}</h3>
      </div>
      <div class="action-popup-content">
        <p>${actionInfo.message}</p>
        <p>${player.name}'s current balance: ₹${player.money}</p>
      </div>
      <div class="property-popup-actions">
        <button class="action-ok">OK</button>
      </div>
    `

    document.body.appendChild(actionPopup)

    actionPopup.querySelector(".action-ok").addEventListener("click", () => {
      document.body.removeChild(actionPopup)
      actionPopup = null
    })

    setTimeout(() => {
      if (actionPopup && actionPopup.parentNode) {
        document.body.removeChild(actionPopup)
        actionPopup = null
      }
    }, 3000)
  }

  function movePlayerToJail(player) {
    const token = document.getElementById(`player-${player.id}`)
    token.parentNode.removeChild(token)
    player.position = 8
    document.querySelector(`.space[data-position="8"]`).appendChild(token)
    updatePlayerStats()
  }

  function checkPropertyPurchase(player) {
    const space = document.querySelector(`.space[data-position="${player.position}"]`)

    // Skip property purchase for jail location
    if (player.position === 8) {
      setTimeout(() => {
        isProcessingTurn = false
        nextPlayerTurn()
      }, 1000)
      return
    }

    if (
      space.classList.contains("property") ||
      space.classList.contains("railroad") ||
      space.classList.contains("utility")
    ) {
      const propertyName = space.querySelector(".name")?.textContent
      const propertyPrice = Number.parseInt(space.getAttribute("data-price"))
      const propertyRent = Number.parseInt(space.getAttribute("data-rent"))
      const owner = getPropertyOwner(player.position)

      if (owner) {
        if (owner.id !== player.id) {
          payRent(player, owner, propertyRent, propertyName)
        } else {
          addGameLog(`${player.name} owns this property already.`, "info")
          setTimeout(() => {
            isProcessingTurn = false
            nextPlayerTurn()
          }, 1500)
        }
      } else {
        if (player.money >= propertyPrice) {
          showPropertyPurchasePopup(player, propertyName, propertyPrice, propertyRent, player.position)
        } else {
          addGameLog(`${player.name} doesn't have enough money to buy this property!`, "info")
          setTimeout(() => {
            isProcessingTurn = false
            nextPlayerTurn()
          }, 1500)
        }
      }
    } else {
      setTimeout(() => {
        isProcessingTurn = false
        nextPlayerTurn()
      }, 1000)
    }
  }

  // Find the payRent function and modify it to show a notification popup
  function payRent(player, owner, rent, propertyName) {
    player.money -= rent
    owner.money += rent

    // Show rent payment notification
    if (actionPopup) {
      document.body.removeChild(actionPopup)
    }

    actionPopup = document.createElement("div")
    actionPopup.className = "property-popup action-popup action-popup-warning"
    actionPopup.innerHTML = `
    <div class="property-popup-header">
      <h3>Rent Payment</h3>
    </div>
    <div class="action-popup-content">
      <p>${player.name} paid ₹${rent} rent to ${owner.name} for ${propertyName}</p>
      <p>${player.name}'s new balance: ₹${player.money}</p>
      <p>${owner.name}'s new balance: ₹${owner.money}</p>
    </div>
    <div class="property-popup-actions">
      <button class="action-ok">OK</button>
    </div>
  `

    document.body.appendChild(actionPopup)

    actionPopup.querySelector(".action-ok").addEventListener("click", () => {
      document.body.removeChild(actionPopup)
      actionPopup = null
      isProcessingTurn = false
      nextPlayerTurn()
    })

    // Auto-close after 3 seconds
    setTimeout(() => {
      if (actionPopup && actionPopup.parentNode) {
        document.body.removeChild(actionPopup)
        actionPopup = null
        isProcessingTurn = false
        nextPlayerTurn()
      }
    }, 3000)

    addGameLog(`${player.name} paid ₹${rent} rent to ${owner.name} for ${propertyName}`, "payment")

    updatePlayerStats()
    updatePropertyOwnershipCorner()
  }

  function getPropertyOwner(position) {
    return players.find((player) => player.properties.includes(position)) || null
  }

  function showPropertyPurchasePopup(player, propertyName, propertyPrice, propertyRent, propertyPosition) {
    if (propertyPopup) {
      document.body.removeChild(propertyPopup)
    }

    propertyPopup = document.createElement("div")
    propertyPopup.className = "property-popup"
    propertyPopup.innerHTML = `
      <div class="property-popup-header">
        <h3>Property Purchase</h3>
      </div>
      <div class="property-popup-content">
        <p>${player.name}, would you like to buy ${propertyName} for ₹${propertyPrice}?</p>
        <p>Rent: ₹${propertyRent}</p>
        <p>Your current balance: ₹${player.money}</p>
      </div>
      <div class="property-popup-actions">
        <button class="buy-property">Buy</button>
        <button class="ignore-property">Pass</button>
      </div>
    `

    document.body.appendChild(propertyPopup)

    propertyPopup.querySelector(".buy-property").addEventListener("click", () => {
      buyProperty(player, propertyName, propertyPrice, propertyPosition)
      document.body.removeChild(propertyPopup)
      propertyPopup = null
    })

    propertyPopup.querySelector(".ignore-property").addEventListener("click", () => {
      addGameLog(`${player.name} decided not to buy ${propertyName}`, "info")
      document.body.removeChild(propertyPopup)
      propertyPopup = null
      isProcessingTurn = false
      nextPlayerTurn()
    })
  }

  function buyProperty(player, propertyName, propertyPrice, propertyPosition) {
    player.money -= propertyPrice
    player.properties.push(propertyPosition)

    const space = document.querySelector(`.space[data-position="${propertyPosition}"]`)
    const ownerIndicator = document.createElement("div")
    ownerIndicator.className = "owner-indicator"
    ownerIndicator.style.backgroundColor = player.color
    space.appendChild(ownerIndicator)

    addGameLog(`${player.name} bought ${propertyName} for ₹${propertyPrice}`, "property")

    updatePlayerStats()
    updatePropertyOwnershipCorner()

    checkForMonopoly(player)

    isProcessingTurn = false
    nextPlayerTurn()
  }

  function checkForMonopoly(player) {
    for (const [groupName, positions] of Object.entries(propertyGroups)) {
      const ownsAll = positions.every((position) => player.properties.includes(position))

      if (ownsAll) {
        addGameLog(`${player.name} now has a monopoly on the ${groupName} properties!`, "property")

        positions.forEach((position) => {
          const space = document.querySelector(`.space[data-position="${position}"]`)
          if (space) {
            const groupIndicator = space.querySelector(".property-group")
            if (groupIndicator) {
              groupIndicator.style.display = "block"
            }
          }
        })
      }
    }
  }

  function nextPlayerTurn() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length
    updatePlayerStats()
    document.getElementById("roll-dice").disabled = false
  }

  function addGameLog(message, type = "info") {
    const now = new Date()
    const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`

    // Store log in the array
    gameLogs.push({
      timestamp,
      message,
      type,
      date: now.toISOString(),
    })

    // Send log to server
    sendLogToServer({
      timestamp,
      message,
      type,
      date: now.toISOString(),
    })
  }

  function sendLogToServer(logData) {
    fetch("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logData),
    }).catch((error) => {
      console.error("Error sending log to server:", error)
    })
  }

  // Initialize the game
  initializeBoard()
  createDiceUI()
  createPlayerTokens()
  addGameLog("Game started! Welcome to Monopoly!", "system")
})

