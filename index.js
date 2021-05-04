import http from "http";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import websocket from "websocket";
import Player from "./classes/player.js";
import {
  guid,
  maakTegels,
  diceArray,
  checker,
  changeTurn,
  determineTegels,
} from "./helpers/helperMethods.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 9091;

app.use(express.static(path.join(__dirname, "/public/")));
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));

const websocketServer = websocket.server;
const httpServer = http.createServer(app);

httpServer.listen(PORT, () => console.log("Listening.. on ", PORT));
//hashmap clients
const clients = {};
let games = {};
const wsServer = new websocketServer({
  httpServer: httpServer,
});

function createStartingState(clientId) {
  return {
    tegels: maakTegels(),
    number: 8,
    currentPlayer: clientId,
    players: [],
    gameOver: false,
    ongeldigeWorp: false,
    results: [],
    selectedResults: [],
    xGegooid: false,
    selectableTegels: [],
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
      const gameId = guid();
      if (gameName === "") {
        gameName = gameId.substring(0, 8);
      }
      games[gameId] = {
        id: gameId,
        gameName: gameName,
        gameCreatedAt: gameCreatedAt,
        gameStarted: false,
        clients: [],
        state: createStartingState(clientId),
      };
      const game = games[gameId];
      const payLoad = {
        method: "create",
        game: game,
        games: games,
      };

      wsServer.connections.forEach((c) => {
        c.send(JSON.stringify(payLoad));
      });
    }
    if (result.method === "chatMessage") {
      // todo dit omschrijven voor messages in 1 object.
      message = result.message;
      const clientId = result.clientId;
      const gameId = result.gameId;
      const game = games[gameId];
      const naam = game.clients.find((x) => x.clientId === clientId).clientName;
      const color = game.clients.find((x) => x.clientId === clientId).color;
      const payLoad = {
        method: "chatMessage",
        message: `${naam}: ${message}`,
        clientColor: color,
      };
      clientList.forEach((c) => {
        clients[c].connection.send(JSON.stringify(payLoad));
      });
    }

    if (result.method === "startGame") {
      const gameId = result.gameId;
      const game = games[gameId];
      game["gameStarted"] = true;
      const payLoad = {
        method: "gameStarted",
        game: game,
      };
      //loop through all clients and tell them that people has joined
      game.clients.forEach((c) => {
        clients[c.clientId].connection.send(JSON.stringify(payLoad));
      });
      wsServer.connections.forEach((connection) => {
        connection.send(JSON.stringify(payLoad));
      });
      updateGameState();
    }

    if (result.method === "exitGame") {
      const gameId = result.gameId;
      const game = games[gameId];
      let state = games[gameId].state;
      const players = state.players.filter((x) => x.clientId !== clientId);
      const clients = game.clients.filter((x) => x.clientId !== clientId);
      state["players"] = players;
      games[gameId].clients = clients;
      games[gameId].state = state;
      updateGameState();
    }

    //a client want to join
    if (result.method === "join") {
      const clientId = result.clientId;
      const gameId = result.gameId;
      const game = games[gameId];
      const clientName = result.clientName;

      if (game.clients.length > 4) {
        //sorry max players reach
        return;
      }
      const color = { 0: "Red", 1: "Green", 2: "Blue", 3: "Yellow" }[
        game.clients.length
      ];
      const order = game.clients.length + 1;
      const player = new Player(clientId, clientName, color, order);
      game.clients.push({
        clientId: clientId,
        color: color,
        clientName: clientName,
      });
      game.state.players.push(player);
      //start the game
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
      if (!state) state = {};
      let number = state["number"];
      const selectedResults = state["selectedResults"];
      const results = diceArray(number);

      if (selectedResults.length > 0) {
        state["ongeldigeWorp"] = checker(results, selectedResults);
      }

      state["results"] = results;
      state["diceThrown"] = "yes";
      state["selectableTegels"] = [];
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
      let hoeveelheid = 0;
      let selectableTegels = state["selectableTegels"];
      const tegels = state["tegels"];
      const players = state["players"];

      for (let i = 0; i < number; i++) {
        if (String(results[i]["dice"]) === String(selectedValue["dice"])) {
          selectedResults.push(selectedValue);
          hoeveelheid++;
        }
      }
      const overgebleven = number - hoeveelheid;
      let total = 0;
      if (selectedResults.length > 0) {
        let arr = selectedResults.map((x) => parseInt(x.waarde));
        total = arr.reduce((a, b) => a + b);
      }
      const xGegooid = selectedResults.map((x) => x.dice).includes("X");
      if (xGegooid && total >= 21) {
        selectableTegels = determineTegels(total, tegels);
      } else {
        selectableTegels = [];
      }

      const stealableTegel = players.find(
        (player) => parseInt(player.topTegel.waarde) === total
      );
      console.log(stealableTegel);
      state["stealableTegel"] = stealableTegel;
      state["selectableTegels"] = selectableTegels;
      state["results"] = [];
      state["total"] = total;
      state["diceThrown"] = "no";
      state["selectedResults"] = selectedResults;
      state["number"] = overgebleven;
      state["xGegooid"] = xGegooid;
      state["ongeldigeWorp"] = false;
      games[gameId].state = state;
      updateGameState();
    }
    if (result.method === "selectTegel") {
      const gameId = result.gameId;
      const clientId = result.clientId;
      const selectedTegel = result.selectedTegel;
      let state = games[gameId].state;
      const beschikbareTegels = state["tegels"];
      const overgeblevenTegels = beschikbareTegels.filter(
        (tegel) => tegel["waarde"] !== selectedTegel["waarde"]
      );
      let players = state["players"];
      const updatedPlayer = players.find(
        (player) => player.clientId === clientId
      );
      updatedPlayer.addTegel(selectedTegel);
      players = [
        ...players.map((player) =>
          player.clientId === clientId ? updatedPlayer : player
        ),
      ];
      state["tegels"] = overgeblevenTegels;
      state["players"] = players;
      // volgende speler krijgt de beurt.
      state["currentPlayer"] = changeTurn(clientId, players);
      state["diceThrown"] = "no";
      state["results"] = [];
      state["number"] = 8;
      state["total"] = 0;
      state["selectedResults"] = [];
      if (overgeblevenTegels.length === 0) {
        console.log("het spel is klaar");
        state["gameOver"] = true;
        let winnaar = null;
        state["winnaar"] = winnaar;
      }
      games[gameId].state = state;
      updateGameState();
    }

    if (result.method === "stolenTegel") {
      const gameId = result.gameId;
      const clientId = result.clientId;
      const selectedTegel = result.selectedTegel;
      let state = games[gameId].state;

      const players = state["players"];
      const playerOwning = players.find((player) => player.ownsTegel(tegel));
      playerOwning.removeTegel(tegel);
      const playerStealing = players.find(
        (player) => player.clientId === currentPlayer
      );
      playerStealing.addTegel(tegel);
      players = [
        ...players.map((player) =>
          player.clientId === playerOwning.clientId
            ? playerOwning
            : player.clientId === playerStealing.clientId
            ? playerStealing
            : player
        ),
      ];
      state["currentPlayer"] = changeTurn(clientId, players);
      state["number"] = 8;
      state["total"] = 0;
      state["results"] = [];
      state["selectedResults"] = [];
      state["diceThrown"] = "no";
      state["players"] = players;
      games[gameId].state = state;
      updateGameState();
    }

    if (result.method === "endTurn") {
      const gameId = result.gameId;
      const game = games[gameId];
      const clientId = result.clientId;
      let state = games[gameId].state;
      let tegels = state["tegels"];
      const players = state["players"];

      const laatsteTegelPlayer = players
        .find((player) => player.clientId === clientId)
        .removeLastTegel();
      const laatsteTegel = tegels.slice(0).pop();
      if (laatsteTegel && laatsteTegelPlayer) {
        if (laatsteTegelPlayer.waarde < laatsteTegel.waarde) {
          tegels = tegels.filter((x) => x.waarde !== laatsteTegelPlayer.waarde);
        }
      }
      tegels.push(laatste);

      tegels = tegels.slice(0).sort((a, b) => {
        return parseInt(a.waarde) < parseInt(b.waarde) ? -1 : 1;
      });
      // nog toevoegen van je steentje verliezen.

      state["tegels"] = tegels;
      state["currentPlayer"] = changeTurn(clientId, players);
      state["number"] = 8;
      state["diceThrown"] = "no";
      state["total"] = 0;
      state["results"] = [];
      state["selectedResults"] = [];
      state["ongeldigeWorp"] = false;
      games[gameId].state = state;
      updateGameState();
    }
    if (result.method === "closeGames") {
      games = {};
      const payLoad = {
        method: "gamesClosed",
        games: {},
      };
      wsServer.connections.forEach((c) => {
        c.send(JSON.stringify(payLoad));
      });
    }
  });

  const clientId = guid();
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
