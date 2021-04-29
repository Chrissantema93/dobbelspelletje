 export default class Player {
    clientId = '';
    playerName = '';
    playerColor = '';
    playerOrder = null;
    playerTag = null;
    playerTegels = [];
    constructor(clientId, playerName, playerColor, playerOrder) {
        this.clientId = clientId;
        this.playerName = playerName;
        this.playerColor = playerColor
        this.playerOrder = playerOrder
        this.playerTag = `Player${playerOrder}`;
    }
    addTegel(tegel) {
        this.playerTegels = [...this.playerTegels, tegel]
    }
    removeTegel(tegel) {
        this.playerTegels = [...this.playerTegels.filter((x) => {
            return x.waarde !== tegel.waarde;
          })]
    }

}

