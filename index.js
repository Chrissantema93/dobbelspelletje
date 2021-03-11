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
let games = {};
let startingPlayer = null;
let currentPlayer = null;
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
  };
}

wsServer.on("request", (request) => {
  //connect
  const connection = request.accept(null, request.origin);
  connection.on("open", () => console.log("opened!"));
  connection.on("close", () => console.log("closed!"));
  connection.on("message", (message) => {
    const result = JSON.parse(message.utf8Data);
    //I have received a message from the client
    //a user want to create a new game
    if (result.method === "create") {
      const clientId = result.clientId;
      currentPlayer = clientId;
      startingPlayer = currentPlayer;
      console.log(currentPlayer, "begin van t spel speler");
      const gameId = guid();
      games[gameId] = {
        id: gameId,
        clients: [],
        state: createStartingState(currentPlayer),
      };

      const payLoad = {
        method: "create",
        game: games[gameId],
        games: games,
      };

      const con = clients[clientId].connection;
      con.send(JSON.stringify(payLoad));
    }

    //a client want to join
    if (result.method === "join") {
      const clientId = result.clientId;
      const gameId = result.gameId;
      const game = games[gameId];
      if (game.clients.length >= 2) {
        //sorry max players reach
        return;
      }
      const color = { 0: "Red", 1: "Green" }[game.clients.length];
      game.clients.push({
        clientId: clientId,
        color: color,
      });
      //start the game
      if (game.clients.length === 2) updateGameState();
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
    //a user plays
    if (result.method === "play") {
      const gameId = result.gameId;
      const ballId = result.ballId;
      const color = result.color;
      let state = games[gameId].state;
      if (!state) state = {};

      state[ballId] = color;
      games[gameId].state = state;
      updateGameState();
    }

    if (result.method === "dice") {
      const gameId = result.gameId;
      let state = games[gameId].state;
      game = games[gameId];
      let results = [];
      if (!state) state = {};

      for (let i = 0; i < 8; i++) {
        results.push(rollDice());
      }
      // if(currentPlayer === game.clients[0].clientId) {
      //     currentPlayer = game.clients[1].clientId
      // } else {
      //     currentPlayer = game.clients[0].clientId
      // }
      // state["currentPlayer"] = currentPlayer
      // console.log(currentPlayer)

      state["results"] = results;
      state["number"] = 8;
      state["diceThrown"] = "yes";
      state["availableTegels"] = maakTegels();
      games[gameId].state = state;
      updateGameState();
    }

    if (result.method === "selectDice") {
      const gameId = result.gameId;
      const clientId = result.clientId;
      const results = result.results;
      const selectedValue = parseInt(result.selectedValue);
      const selectedResults = result.selectedResults;
      const number = result.number;
      const total = result.total;
      console.log("selected", selectedValue);
      let state = games[gameId].state;
      game = games[gameId];
      if (!state) state = {};
      let hoeveelheid = 0;
      for (let i = 0; i < number; i++) {
        console.log(results[i], selectedValue, results[i] === selectedValue);
        if (results[i] === selectedValue) {
          selectedResults.push(selectedValue);
          hoeveelheid++;
        }
      }
      selectedResults.forEach((e) => console.log("waarde", e));
      overgebleven = number - hoeveelheid;
      console.log("overgebleven", overgebleven);
      state["results"] = diceArray(overgebleven);
      state["selectedResults"] = selectedResults;
      state["number"] = overgebleven;
      games[gameId].state = state;
      updateGameState();
    }
    if (result.method === "selectTegel") {
      const gameId = result.gameId;
      const clientId = result.clientId;
      const selectedTegel = parseInt(result.selectedTegel);
      let state = games[gameId].state;
      const beschikbareTegels = state["tegels"];
      const overgeblevenTegels = beschikbareTegels.filter(
        (tegel) => tegel !== selectedTegel
      );
      state["tegels"] = overgeblevenTegels;
      if (startingPlayer === clientId) {
        state["player1Tegels"].push(selectedTegel);
      } else {
        state["player2Tegels"].push(selectedTegel);
      }
      game = games[gameId];
      state["currentPlayer"] = changeTurn(clientId, game.clients);
      state["diceThrown"] = "no";
      state["results"] = [];
      state["selectedResults"] = [];
      games[gameId].state = state;
      console.log(state["currentPlayer"]);
      updateGameState();
    }
    if (result.method === "endTurn") {
      console.log("ik doe nog ff niks maat");
    }
    if (result.method === "closeGames") {
      games = {};
      console.log("games", games);
    }
  });

  //generate a new clientId
  const clientId = guid();
  clients[clientId] = {
    connection: connection,
  };

  const payLoad = {
    method: "connect",
    clientId: clientId,
  };
  //send back the client connect
  connection.send(JSON.stringify(payLoad));
});

function diceArray(number) {
  results = [];
  for (let i = 0; i < number; i++) {
    results.push(rollDice());
  }
  console.log("resultaten", results);
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
    results.push(i);
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
