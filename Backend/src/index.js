import http from "http";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import websocket from "websocket";
import Player from "./models/playerModel.js";
import gameState from "./models/gamestateModel.js";
import {
  guid,
  changeTurn,
} from "./helpers/generalHelpers.js";

import {handleDiceSelect, handleDiceThrow } from "./helpers/gameStateHelpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 9091;

app.use(express.static(path.resolve(path.join(__dirname, "../../Frontend/public/"))));
app.get("/", (req, res) => res.sendFile(path.resolve(path.join(__dirname, "../../Frontend/index.html"))));

const websocketServer = websocket.server;
const httpServer = http.createServer(app);

httpServer.listen(PORT, () => console.log("Listening.. on ", PORT));
//hashmap clients
const clients = {};
let games = {};

const wsServer = new websocketServer({
  httpServer: httpServer,
});



wsServer.on("request", (request) => {
  //connect
  const connection = request.accept(null, request.origin);
  connection.on("open", () => console.log("opened!"));
  connection.on("close", () => {
    console.log(connection)
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
        state: new gameState(clientId),
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

    if (result.method === "throwDice") {
      const gameId = result.gameId;
      const state = games[gameId].state;
      const newState = handleDiceThrow(state)
      games[gameId].state = newState;
      updateGameState();
    }

    if (result.method === "selectDice") {
      const gameId = result.gameId;
      const selectedValue = result.selectedValue;
      const state = games[gameId].state;
      const newState = handleDiceSelect(state, selectedValue)
      games[gameId].state = newState;
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
      state["currentPlayer"] = changeTurn(clientId, players);
      
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
      state["players"] = players;
      const newState = state.resetState();
      games[gameId].state = newState;
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
      tegels.push(laatsteTegelPlayer);

      tegels = tegels.slice(0).sort((a, b) => {
        return parseInt(a.waarde) < parseInt(b.waarde) ? -1 : 1;
      });
      state["players"] = players;
      state["tegels"] = tegels;
      state["currentPlayer"] = changeTurn(clientId, players);
      const newState = state.resetState();
      games[gameId].state = newState;
      updateGameState();
    }
    if (result.method === "closeGames") {
      games = {};
      const payLoad = {
        method: "gamesClosed",
        games: {},
      };
      wsServer.connections.forEach((connection) => {
        connection.send(JSON.stringify(payLoad));
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
  connection.send(JSON.stringify(payLoad));
});

function updateGameState() {
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
