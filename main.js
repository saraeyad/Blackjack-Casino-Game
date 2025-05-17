// Card deck and game state variables
let deck = [];
let dealerCards = [];
let playerCards = [];
let dealerSum = 0;
let playerSum = 0;
let dealerAceCount = 0;
let playerAceCount = 0;
let hidden;
let canHit = false;
let gameInProgress = false;
let playerBalance = 1000;
let currentBet = 0;

// DOM elements
const dealerSumElement = document.getElementById("dealer-sum");
const playerSumElement = document.getElementById("player-sum");
const dealerCardsElement = document.getElementById("dealer-cards");
const playerCardsElement = document.getElementById("player-cards");
const messageElement = document.getElementById("message");
const balanceElement = document.getElementById("balance");
const betAmountElement = document.getElementById("bet-amount");
const dealButton = document.getElementById("deal-button");
const hitButton = document.getElementById("hit-button");
const standButton = document.getElementById("stand-button");
const resetButton = document.getElementById("reset-button");

// Card suits and values
const suits = ["♠", "♥", "♦", "♣"];
const values = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

// Event listeners
window.onload = function () {
  updateBalance();

  dealButton.addEventListener("click", startGame);
  hitButton.addEventListener("click", hit);
  standButton.addEventListener("click", stand);
  resetButton.addEventListener("click", resetGame);
};

// Game initialization
function buildDeck() {
  deck = [];
  for (let i = 0; i < suits.length; i++) {
    for (let j = 0; j < values.length; j++) {
      const card = {
        suit: suits[i],
        value: values[j],
        numValue: getCardValue(values[j]),
      };
      deck.push(card);
    }
  }
}

function shuffleDeck() {
  for (let i = 0; i < deck.length; i++) {
    const j = Math.floor(Math.random() * deck.length);
    [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap cards
  }
}

function getCardValue(value) {
  if (value === "A") {
    return 11;
  } else if (value === "J" || value === "Q" || value === "K") {
    return 10;
  }
  return parseInt(value);
}

function startGame() {
  // Get bet amount
  currentBet = parseInt(betAmountElement.value);

  // Validate bet
  if (isNaN(currentBet) || currentBet < 10) {
    messageElement.textContent =
      "Please enter a valid bet amount (minimum $10).";
    return;
  }

  if (currentBet > playerBalance) {
    messageElement.textContent = "You don't have enough balance for this bet.";
    return;
  }

  // Deduct bet from balance
  playerBalance -= currentBet;
  updateBalance();

  // Initialize game
  gameInProgress = true;
  canHit = true;

  // Build and shuffle deck
  buildDeck();
  shuffleDeck();

  // Reset hands
  dealerCards = [];
  playerCards = [];
  dealerSum = 0;
  playerSum = 0;
  dealerAceCount = 0;
  playerAceCount = 0;

  // Clear card displays
  dealerCardsElement.innerHTML = "";
  playerCardsElement.innerHTML = "";

  // Deal initial cards
  hidden = deck.pop();
  dealerSum += hidden.numValue;
  if (hidden.value === "A") dealerAceCount++;

  // Create hidden card
  const hiddenCardElement = document.createElement("div");
  hiddenCardElement.className = "card hidden";
  hiddenCardElement.id = "hidden-card";
  dealerCardsElement.appendChild(hiddenCardElement);

  // Deal visible dealer card
  dealerCards.push(deck.pop());
  dealerSum += dealerCards[0].numValue;
  if (dealerCards[0].value === "A") dealerAceCount++;

  const dealerCardElement = createCardElement(dealerCards[0]);
  dealerCardsElement.appendChild(dealerCardElement);

  // Deal player cards
  for (let i = 0; i < 2; i++) {
    playerCards.push(deck.pop());
    playerSum += playerCards[i].numValue;
    if (playerCards[i].value === "A") playerAceCount++;

    const playerCardElement = createCardElement(playerCards[i]);
    playerCardsElement.appendChild(playerCardElement);
  }

  // Update sums
  dealerSumElement.textContent = "?";
  updatePlayerSum();

  // Enable/disable buttons
  dealButton.disabled = true;
  hitButton.disabled = false;
  standButton.disabled = false;
  betAmountElement.disabled = true;

  // Check for blackjack
  if (playerSum === 21) {
    stand(); // Auto-stand on blackjack
  } else {
    messageElement.textContent = "Hit or Stand?";
  }
}

function hit() {
  if (!canHit) return;

  // Deal a card to player
  const card = deck.pop();
  playerCards.push(card);
  playerSum += card.numValue;
  if (card.value === "A") playerAceCount++;

  // Add card to display
  const cardElement = createCardElement(card);
  playerCardsElement.appendChild(cardElement);

  // Check for bust and reduce aces if needed
  reduceAce(true);
  updatePlayerSum();

  // Check if player busts
  if (playerSum > 21) {
    canHit = false;
    endGame();
  } else if (playerSum === 21) {
    canHit = false;
    stand(); // Auto-stand on 21
  }
}

function stand() {
  // Disable hit and stand buttons
  hitButton.disabled = true;
  standButton.disabled = true;
  canHit = false;

  // Reveal hidden card
  const hiddenCardElement = document.getElementById("hidden-card");
  hiddenCardElement.className = "card";
  hiddenCardElement.innerHTML = createCardContent(hidden);
  if (isRedSuit(hidden.suit)) {
    hiddenCardElement.classList.add("red");
  }

  // Update dealer sum display
  dealerSumElement.textContent = dealerSum;

  // Dealer draws until 17 or higher
  let dealerDone = false;

  function dealerDraw() {
    if (dealerSum < 17) {
      // Deal a card to dealer
      const card = deck.pop();
      dealerCards.push(card);
      dealerSum += card.numValue;
      if (card.value === "A") dealerAceCount++;

      // Add card to display
      const cardElement = createCardElement(card);
      dealerCardsElement.appendChild(cardElement);

      // Check for bust and reduce aces if needed
      reduceAce(false);
      dealerSumElement.textContent = dealerSum;

      // Continue drawing if needed
      setTimeout(dealerDraw, 500);
    } else {
      // Dealer is done drawing
      endGame();
    }
  }

  // Start dealer drawing with a slight delay
  setTimeout(dealerDraw, 500);
}

function endGame() {
  // Determine winner
  let message = "";
  let multiplier = 0;

  // Check for player bust
  if (playerSum > 21) {
    message = "You Bust! Dealer Wins.";
  }
  // Check for dealer bust
  else if (dealerSum > 21) {
    message = "Dealer Busts! You Win!";
    multiplier = 2;
  }
  // Check for player blackjack (21 with 2 cards)
  else if (playerSum === 21 && playerCards.length === 2) {
    if (dealerSum === 21 && dealerCards.length === 1) {
      message = "Both have Blackjack! Push.";
      multiplier = 1;
    } else {
      message = "Blackjack! You Win!";
      multiplier = 2.5; // Blackjack pays 3:2
    }
  }
  // Compare sums
  else if (playerSum > dealerSum) {
    message = "You Win!";
    multiplier = 2;
  } else if (playerSum < dealerSum) {
    message = "Dealer Wins!";
  } else {
    message = "Push! It's a Tie.";
    multiplier = 1;
  }

  // Update message
  messageElement.textContent = message;

  // Update balance
  if (multiplier > 0) {
    playerBalance += currentBet * multiplier;
    updateBalance();
  }

  // Enable/disable buttons
  dealButton.disabled = false;
  hitButton.disabled = true;
  standButton.disabled = true;
  betAmountElement.disabled = false;

  // Reset game state
  gameInProgress = false;
}

function resetGame() {
  // Reset balance
  playerBalance = 1000;
  updateBalance();

  // Reset game state
  gameInProgress = false;

  // Clear cards
  dealerCardsElement.innerHTML = "";
  playerCardsElement.innerHTML = "";

  // Reset sums
  dealerSum = 0;
  playerSum = 0;
  dealerSumElement.textContent = "0";
  playerSumElement.textContent = "0";

  // Reset message
  messageElement.textContent =
    "Welcome to Blackjack! Place your bet and press DEAL to start.";

  // Enable/disable buttons
  dealButton.disabled = false;
  hitButton.disabled = true;
  standButton.disabled = true;
  betAmountElement.disabled = false;
  betAmountElement.value = 50;
}

// Helper functions
function createCardElement(card) {
  const cardElement = document.createElement("div");
  cardElement.className = "card";

  // Add red color for hearts and diamonds
  if (isRedSuit(card.suit)) {
    cardElement.classList.add("red");
  }

  cardElement.innerHTML = createCardContent(card);
  return cardElement;
}

function createCardContent(card) {
  return `
        <div class="card-value">${card.value}</div>
        <div class="card-suit">${card.suit}</div>
    `;
}

function isRedSuit(suit) {
  return suit === "♥" || suit === "♦";
}

function reduceAce(isPlayer) {
  // Reduce ace value from 11 to 1 if sum is over 21
  if (isPlayer) {
    while (playerSum > 21 && playerAceCount > 0) {
      playerSum -= 10;
      playerAceCount--;
    }
  } else {
    while (dealerSum > 21 && dealerAceCount > 0) {
      dealerSum -= 10;
      dealerAceCount--;
    }
  }
}

function updatePlayerSum() {
  playerSumElement.textContent = playerSum;
}

function updateBalance() {
  balanceElement.textContent = playerBalance;
}
