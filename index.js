import http from 'http'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import websocket from 'websocket';
import Player from './classes/player.js';
import {guid, maakTegels, diceArray, checker, changeTurn} from './helpers/helperMethods.js';

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
    players: [],
    gameOver: false,
    ongeldigeWorp: false,
    results: [],
    selectedResults: []
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

      clientList.forEach((c) => {
        clients[c].connection.send(JSON.stringify(payLoad));
      });
    }
    if (result.method === "chatMessage") {
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
      let state = games[gameId].state;
      const game = games[gameId];
      games[gameId].state = state;
      game["gameStarted"] = true;
      const payLoad = {
        method: "gameStarted",
        game: game,
      };
      //loop through all clients and tell them that people has joined
      game.clients.forEach((c) => {
        clients[c.clientId].connection.send(JSON.stringify(payLoad));
      });
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
      const player = new Player(clientId, clientName, color, order)
      game.clients.push({
        clientId: clientId,
        color: color,
        clientName: clientName,
      });
      game.state.players.push(player)
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
        state["ongeldigeWorp"] = checker(
          selectedResults.map((x) => x.dice),
          results.map((x) => x.dice)
        );
      }

      state["results"] = results;
      state["diceThrown"] = "yes";
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

      if (!state) state = {};
      let hoeveelheid = 0;
      for (let i = 0; i < number; i++) {
        if (String(results[i]["dice"]) === String(selectedValue["dice"])) {
          selectedResults.push(selectedValue);
          hoeveelheid++;
        }
      }
      const overgebleven = number - hoeveelheid;
      let total = 0;
      if (selectedResults.length > 0) {
        let arr = selectedResults.map((x) => parseInt(x.value));
        total = arr.reduce((a, b) => a + b);
        state["ongeldigeWorp"] = checker(
          selectedResults.map((x) => x.dice),
          results.map((x) => x.dice)
        );
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
      const player2 = state["player2"];
      const player3 = state["player3"];
      const player4 = state["player4"];
      const overgeblevenTegels = beschikbareTegels.filter(
        (tegel) => tegel["waarde"] !== selectedTegel["waarde"]
      );
      let players = state['players'];
      const updatedPlayer = players.find(player => player.clientId === clientId)
      updatedPlayer.addTegel(selectedTegel)
      players = [...players.map(player => player.clientId === clientId ? updatedPlayer : player)]
      state["tegels"] = overgeblevenTegels;
      state['players'] = players
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

      const players = state["players"]
      let player1Tegels = state["player1Tegels"];
      let player2Tegels = state["player2Tegels"];
      let player3Tegels = state["player3Tegels"];
      let player4Tegels = state["player4Tegels"];
      if (player1 === clientId) {
        player1Tegels.push(selectedTegel);
        player2Tegels = player2Tegels.filter((x) => {
          return x.waarde !== selectedTegel.waarde;
        });
      } else if (player2 === clientId) {
        player2Tegels.push(selectedTegel);
        player1Tegels = player1Tegels.filter((x) => {
          return x.waarde !== selectedTegel.waarde;
        });
      } else if (player3 === clientId) {
        player2Tegels.push(selectedTegel);
        player1Tegels = player1Tegels.filter((x) => {
          return x.waarde !== selectedTegel.waarde;
        });
      } else if (player4 === clientId) {
        player2Tegels.push(selectedTegel);
        player1Tegels = player1Tegels.filter((x) => {
          return x.waarde !== selectedTegel.waarde;
        });
      }
      state["currentPlayer"] = changeTurn(clientId, players);
      state["player1Tegels"] = player1Tegels;
      state["player2Tegels"] = player2Tegels;
      state["number"] = 8;
      state["total"] = 0;
      state["results"] = [];
      state["selectedResults"] = [];
      state["diceThrown"] = "no";
      games[gameId].state = state;
      updateGameState();
    }

    if (result.method === "endTurn") {
      const gameId = result.gameId;
      const game = games[gameId];
      const clientId = result.clientId;
      let state = games[gameId].state;
      // player1Tegels = state["player1Tegels"];
      // player2Tegels = state["player2Tegels"];
      // player1 = state["player1"];
      let tegels = state["tegels"];
      const players = state['players'];

      // if (clientId === player1) {
      //   if (player1Tegels.length > 0) {
      //     laatste = player1Tegels.pop();
      //     player1Tegels = player1Tegels.filter((x) => x !== laatste);
      //     laatsteTegel = tegels.slice(0).pop();
      //     if (laatste.waarde < laatsteTegel.waarde) {
      //       tegels = tegels.filter((x) => x.waarde !== laatsteTegel.waarde);
      //     }
      //     tegels.push(laatste);
      //   }
      // } else {
      //   if (player2Tegels.length > 0) {
      //     laatste = player2Tegels.pop();
      //     player2Tegels = player2Tegels.filter((x) => x !== laatste);
      //     laatsteTegel = tegels.slice(0).pop();
      //     if (laatste.waarde < laatsteTegel.waarde) {
      //       tegels = tegels.filter((x) => x.waarde !== laatsteTegel.waarde);
      //     }
      //     tegels.push(laatste);
      //   }
      // }
      tegels = tegels.slice(0).sort((a, b) => {
        return parseInt(a.waarde) < parseInt(b.waarde) ? -1 : 1;
      });
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

