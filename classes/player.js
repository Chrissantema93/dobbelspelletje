export default class Player {
  clientId = null;
  playerName = null;
  playerColor = null;
  playerOrder = null;
  playerTag = null;
  playerTegels = [];
  constructor(clientId, playerName, playerColor, playerOrder) {
    this.clientId = clientId;
    this.playerName = playerName;
    this.playerColor = playerColor;
    this.playerOrder = playerOrder;
    this.playerTag = `Player${playerOrder}`;
  }
  addTegel(tegel) {
    this.playerTegels = [...this.playerTegels, tegel];
  }
  removeTegel(tegel) {
    this.playerTegels = [
      ...this.playerTegels.filter((x) => {
        return x.waarde !== tegel.waarde;
      }),
    ];
  }
  removeLastTegel() {
    const lastTegel = this.playerTegels.slice(-1)[0];
    this.playerTegels = [...this.playerTegels.splice(-1, 1)];
    return lastTegel;
  }
  ownsTegel(tegel) {
    return this.playerTegels.includes(tegel);
  }

  topTegel() {
    return this.playerTegels[this.playerTegels.length - 1];
  }
}
