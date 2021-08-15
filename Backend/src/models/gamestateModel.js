export default class gameState {
  currentPlayer = "";
  dicesLeft = 8;
  total = 0;
  diceThrown = false;
  gameOver = false;
  ongeldigeWorp = false;
  penguinThrown = false;
  players = [];
  results = [];
  selectableTegels = [];
  chosenDices = [];
  tegels = [
    { waarde: 21, punten: 1 },
    { waarde: 22, punten: 1 },
    { waarde: 23, punten: 1 },
    { waarde: 24, punten: 1 },
    { waarde: 25, punten: 2 },
    { waarde: 26, punten: 2 },
    { waarde: 27, punten: 2 },
    { waarde: 28, punten: 2 },
    { waarde: 29, punten: 3 },
    { waarde: 30, punten: 3 },
    { waarde: 31, punten: 3 },
    { waarde: 32, punten: 3 },
    { waarde: 33, punten: 4 },
    { waarde: 34, punten: 4 },
    { waarde: 35, punten: 4 },
    { waarde: 36, punten: 4 },
  ];
  buttons = {
    endTurn : false
  }
  constructor(clientId) {
    this.currentPlayer = clientId;
  }
}
