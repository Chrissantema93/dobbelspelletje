const http = require("http");
const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 9091;

app.use(express.static(path.join(__dirname, "/public/")));
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));

const websocketServer = require("websocket").server;
const httpServer = http.createServer(app);
httpServer.listen(PORT, () => console.log("Listening.. on ", PORT));
//hashmap clients
const clients = {};
const clientList = [];
let games = {};
const wsServer = new websocketServer({
  httpServer: httpServer,
});

function createStartingState(clientId) {
  return {
    tegels: maakTegels(),
    number: 8,
    currentPlayer: clientId,
    player1Tegels: [],
    player2Tegels: [],
    gameOver: false,
    ongeldigeWorp: false,
  };
}

wsServer.on("request", (request) => {
  //connect
  const connection = request.accept(null, request.origin);
  connection.on("open", () => console.log("opened!"));
  connection.on("close", () => {
    console.log("closed!");
  });
  connection.on("message", (message) => {
    const result = JSON.parse(message.utf8Data);
    //I have received a message from the client
    //a user want to create a new game

    if (result.method === "create") {
      const clientId = result.clientId;
      let gameName = result.gameName;
      let gameCreatedAt = new Date();
      currentPlayer = clientId;
      const gameId = guid();
      if (gameName === "") {
        gameName = gameId;
      }
      games[gameId] = {
        id: gameId,
        gameName: gameName,
        gameCreatedAt: gameCreatedAt,
        clients: [],
        state: createStartingState(clientId),
      };
      game = games[gameId];
      const payLoad = {
        method: "create",
        game: game,
        games: games,
      };

      clientList.forEach((c) => {
        clients[c].connection.send(JSON.stringify(payLoad));
      });
    }
    if (result.method === "chatMessage") {
      message = result.message;

      const payLoad = {
        method: "chatMessage",
        message: message,
      };
      clientList.forEach((c) => {
        clients[c].connection.send(JSON.stringify(payLoad));
      });
    }
    //a client want to join
    if (result.method === "join") {
      const clientId = result.clientId;
      const gameId = result.gameId;
      const game = games[gameId];
      const clientName = result.clientName;

      if (game.clients.length >= 2) {
        //sorry max players reach
        return;
      }
      const color = { 0: "Red", 1: "Green" }[game.clients.length];
      game.clients.push({
        clientId: clientId,
        color: color,
        clientName: clientName,
      });
      //start the game
      if (game.clients.length === 2) {
        let state = games[gameId].state;
        state["player1"] = game.clients[0].clientId;
        state["player2"] = game.clients[1].clientId;
        games[gameId].state = state;
        updateGameState();
      }
      tegels = maakTegels();
      const payLoad = {
        method: "join",
        game: game,
      };
      //loop through all clients and tell them that people has joined
      game.clients.forEach((c) => {
        clients[c.clientId].connection.send(JSON.stringify(payLoad));
      });
    }

    if (result.method === "dice") {
      const gameId = result.gameId;
      let state = games[gameId].state;
      game = games[gameId];

      if (!state) state = {};
      number = state["number"];
      results = diceArray(number);
      state["results"] = results;
      state["diceThrown"] = "yes";
      state["availableTegels"] = maakTegels();
      games[gameId].state = state;
      updateGameState();
    }

    if (result.method === "selectDice") {
      const gameId = result.gameId;
      const results = result.results;
      const selectedValue = result.selectedValue;
      const selectedResults = result.selectedResults;
      const number = result.number;
      let state = games[gameId].state;
      game = games[gameId];

      if (!state) state = {};
      let hoeveelheid = 0;
      for (let i = 0; i < number; i++) {
        if (String(results[i]["dice"]) === String(selectedValue["dice"])) {
          selectedResults.push(selectedValue);
          hoeveelheid++;
        }
      }
      overgebleven = number - hoeveelheid;

      if (selectedResults.length > 0) {
        arr = selectedResults.map((x) => parseInt(x.value));
        total = arr.reduce((a, b) => a + b);
      }
      state["results"] = [];
      state["total"] = total;
      state["diceThrown"] = "no";
      state["selectedResults"] = selectedResults;
      state["number"] = overgebleven;
      games[gameId].state = state;
      updateGameState();
    }
    if (result.method === "selectTegel") {
      const gameId = result.gameId;
      const clientId = result.clientId;
      const selectedTegel = result.selectedTegel;
      let state = games[gameId].state;
      const beschikbareTegels = state["tegels"];
      const player1 = state["player1"];
      const overgeblevenTegels = beschikbareTegels.filter(
        (tegel) => tegel["waarde"] !== selectedTegel["waarde"]
      );
      state["tegels"] = overgeblevenTegels;
      if (player1 === clientId) {
        state["player1Tegels"].push(selectedTegel);
      } else {
        state["player2Tegels"].push(selectedTegel);
      }
      game = games[gameId];
      state["currentPlayer"] = changeTurn(clientId, game.clients);
      state["diceThrown"] = "no";
      state["results"] = [];
      state["number"] = 8;
      state["total"] = 0;
      state["selectedResults"] = [];
      games[gameId].state = state;
      updateGameState();
    }

    if (result.method === "stolenTegel") {
      const gameId = result.gameId;
      const clientId = result.clientId;
      const selectedTegel = result.selectedTegel;
      let state = games[gameId].state;
      const player1 = state["player1"];
      player1Tegels = state["player1Tegels"];
      player2Tegels = state["player2Tegels"];

      if (player1 === clientId) {
        player1Tegels.push(selectedTegel);
        player2Tegels = player2Tegels.filter((x) => x !== selectedTegel);
      } else {
        player2Tegels.push(selectedTegel);
        player1Tegels = player1Tegels.filter((x) => x !== selectedTegel);
      }
      game = games[gameId];
      state["currentPlayer"] = changeTurn(clientId, game.clients);
      state["player1Tegels"] = player1Tegels;
      state["player2Tegels"] = player2Tegels;
      state["number"] = 8;
      state["results"] = [];
      state["selectedResults"] = [];
      kij;
      state["diceThrown"] = "no";
      games[gameId].state = state;
      updateGameState();
    }

    if (result.method === "endTurn") {
      const gameId = result.gameId;
      game = games[gameId];
      const clientId = result.clientId;
      let state = games[gameId].state;
      player1Tegels = state["player1Tegels"];
      player2Tegels = state["player2Tegels"];
      player1 = state["player1"];
      tegels = state["tegels"];
      if (clientId === player1) {
        if (player1Tegels.length > 0) {
          laatste = player1Tegels.pop();
          player1Tegels = player1Tegels.filter((x) => x !== laatste);
          laatsteTegel = tegels.pop();
          tegels = tegels.filter((x) => x !== laatsteTegel);
          tegels.push(laatste);
        }
      } else {
        if (player2Tegels.length > 0) {
          laatste = player2Tegels.pop();
          player2Tegels = player2Tegels.filter((x) => x !== laatste);
          laatsteTegel = tegels.pop();
          tegels = tegels.filter((x) => x !== laatsteTegel);
          tegels.push(laatste);
        }
      }
      // console.log("voor", tegels);
      tegels = tegels.slice(0).sort((a, b) => {
        return parseInt(a.waarde) < parseInt(b.waarde) ? -1 : 1;
      }); // dit werkt natuurlijk niet
      // console.log("na", tegels);
      state["tegels"] = tegels;
      state["player1Tegels"] = player1Tegels;
      state["player2Tegels"] = player2Tegels;
      state["currentPlayer"] = changeTurn(clientId, game.clients);
      state["number"] = 8;
      state["diceThrown"] = "no";
      state["total"] = 0;
      state["results"] = [];
      state["selectedResults"] = [];
      games[gameId].state = state;
      updateGameState();
    }
    if (result.method === "closeGames") {
      games = {};
      const payLoad = {
        method: "gamesClosed",
        games: {},
      };
      clientList.forEach((c) => {
        clients[c].connection.send(JSON.stringify(payLoad));
      });
    }
  });

  const clientId = guid();
  clientList.push(clientId);
  clients[clientId] = {
    connection: connection,
  };

  const payLoad = {
    method: "connect",
    clientId: clientId,
    games: games,
  };
  //send back the client connect
  connection.send(JSON.stringify(payLoad));
});

function diceArray(number) {
  results = [];
  for (let i = 0; i < number; i++) {
    x = rollDice();
    if (x === 6) {
      results.push({ dice: "X", value: 5 });
    } else {
      results.push({ dice: x, value: x });
    }
  }
  return results;
}

function rollDice() {
  return Math.ceil(Math.random() * 6);
}

function updateGameState() {
  //{"gameid", fasdfsf}
  for (const g of Object.keys(games)) {
    const game = games[g];
    const payLoad = {
      method: "update",
      game: game,
    };

    game.clients.forEach((c) => {
      clients[c.clientId].connection.send(JSON.stringify(payLoad));
    });
  }
}

function maakTegels() {
  results = [];
  for (let i = 21; i <= 36; i++) {
    if (i <= 24) {
      punten = 1;
    } else if (i <= 28) {
      punten = 2;
    } else if (i <= 32) {
      punten = 3;
    } else {
      punten = 4;
    }
    results.push({ waarde: i, punten: punten });
  }
  return results;
}

function changeTurn(clientId, clients) {
  if (clients[0].clientId === clientId) {
    return clients[1].clientId;
  } else {
    return clients[0].clientId;
  }
}

function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// then to call it, plus stitch in '4' in the third group
const guid = () =>
  (
    S4() +
    S4() +
    "-" +
    S4() +
    "-4" +
    S4().substr(0, 3) +
    "-" +
    S4() +
    "-" +
    S4() +
    S4() +
    S4()
  ).toLowerCase();
