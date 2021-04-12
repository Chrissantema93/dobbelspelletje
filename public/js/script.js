let clientId = null;
let gameId = null;
let playerColor = null;
let overgebleven = null;
let total = null;

let HOST = location.origin.replace(/^http/, "ws");
let ws = new WebSocket(HOST);
const btnCreate = document.getElementById("btnCreate");
const menuDiv = document.getElementById("menu");
const txtGameId = document.getElementById("txtGameId");
const divTegels = document.getElementById("tegels");
const divPlayers = document.getElementById("divPlayers");
const divBoard = document.getElementById("divBoard");
const player1Name = document.getElementById("player1Name");
const player2Name = document.getElementById("player2Name");
const player1 = document.getElementById("player1");
const player2 = document.getElementById("player2");
const gamesList = document.getElementById("gamesList");
const btnDice = document.getElementById("btnDice");
const endTurn = document.getElementById("endTurn");
const startGame = document.getElementById("startGame");
const closeGames = document.getElementById("closeGames");
const btnTotal = document.getElementById("totaal");
const selectedDice = document.getElementById("selectedDice");
const gameWindow = document.getElementById("gameWindow");
const chatInput = document.getElementById("chatInput");
const sendChat = document.getElementById("sendChat");
const chatBox = document.getElementById("chatBox");
const chatScreen = document.getElementById("chatScreen");
//wiring events

startGame.addEventListener("click", (e) => {
  endTurn.style.display = "initial";
  const payLoad = {
    method: "startGame",
    gameId: gameId,
  };
  ws.send(JSON.stringify(payLoad));
});

sendChat.addEventListener("click", (e) => {
  const text = chatInput.value;
  chatInput.value = "";
  const payLoad = {
    method: "chatMessage",
    message: text,
    clientId: clientId,
    gameId: gameId,
  };
  ws.send(JSON.stringify(payLoad));
});

btnCreate.addEventListener("click", (e) => {
  gameName = txtGameId.value;
  const payLoad = {
    method: "create",
    clientId: clientId,
    gameName: gameName,
  };

  ws.send(JSON.stringify(payLoad));
});

btnDice.addEventListener("click", (e) => {
  if (gameId === null) gameId = txtGameId.value;
  const payLoad = {
    method: "dice",
    clientId: clientId,
    gameId: gameId,
  };
  ws.send(JSON.stringify(payLoad));
});

endTurn.addEventListener("click", (e) => {
  if (gameId === null) gameId = txtGameId.value;
  const payLoad = {
    method: "endTurn",
    clientId: clientId,
    gameId: gameId,
  };
  ws.send(JSON.stringify(payLoad));
});

closeGames.addEventListener("click", (e) => {
  const payLoad = {
    method: "closeGames",
    clientId: clientId,
  };
  ws.send(JSON.stringify(payLoad));
});

ws.onmessage = (message) => {
  //message.data
  const response = JSON.parse(message.data);
  //connect
  if (response.method === "connect") {
    games = response.games;
    clientId = response.clientId;
    // console.log('storage', sessionStorage.getItem('clientId'))
    // if(sessionStorage.getItem('clientId') === null){
    //   sessionStorage.setItem('clientId', clientId);

    // } else {
    //   clientId = sessionStorage.getItem('clientId')
    // }
    // console.log(clientId)
    while (gamesList.firstChild) {
      gamesList.removeChild(gamesList.firstChild);
    }
    for (const property in games) {
      const g = document.createElement("div");
      gameId = games[property].id;
      g.classList.add("games-names");
      g.textContent = games[property].gameName;
      g.value = gameId;
      const i = document.createElement("input");
      i.placeholder = "je naam";
      const b = document.createElement("button");
      b.textContent = "Neem deel";

      b.addEventListener("click", (e) => {
        let clientName = i.value;
        if (clientName === "") {
          clientName = clientId.substr(0, 8);
        }
        while (menuDiv.firstChild) {
          menuDiv.removeChild(menuDiv.firstChild);
        }
        if (menuDiv) {
          menuDiv.remove();
        }
        gameWindow.style.display = "flex";
        spel.style.display = "flex";
        chatScreen.style.display = "flex";
        const payLoad = {
          method: "join",
          clientId: clientId,
          clientName: clientName,
          gameId: gameId,
        };
        ws.send(JSON.stringify(payLoad));
      });
      g.append(i);
      g.append(b);
      gamesList.append(g);
      if (gamesList.firstChild) {
        btnCreate.disabled = true;
        txtGameId.disabled = true;
      }
    }

    console.log("Client id Set successfully " + clientId);
  }

  if (response.method === "chatMessage") {
    const message = response.message;
    const color = response.clientColor.toLowerCase();
    const g = document.createElement("div");
    g.textContent = message;
    g.style.color = color;
    chatBox.prepend(g);
  }
  //create
  if (response.method === "create") {
    gameId = response.game.id;
    overgebleven = response.game.number;
    games = response.games;
    while (gamesList.firstChild) {
      gamesList.removeChild(gamesList.firstChild);
    }
    for (const property in games) {
      // console.log(`${property}: ${games[property].id}`);
      const g = document.createElement("div");
      const x = document.createElement("div");
      g.classList.add("games-names");
      x.textContent = games[property].gameName;
      x.value = games[property].id;
      g.append(x);
      const i = document.createElement("input");
      i.placeholder = "je naam";
      const b = document.createElement("button");
      b.textContent = "Neem deel";
      const clientName = i.value;
      b.addEventListener("click", (e) => {
        let clientName = i.value;
        if (clientName === "") {
          clientName = clientId.substr(0, 8);
        }
        while (menuDiv.firstChild) {
          menuDiv.removeChild(menuDiv.firstChild);
        }
        gameWindow.style.display = "flex";
        chatScreen.style.display = "flex";
        const payLoad = {
          method: "join",
          clientId: clientId,
          clientName: clientName,
          gameId: gameId,
        };
        ws.send(JSON.stringify(payLoad));
      });
      g.append(i);
      g.append(b);
      gamesList.append(g);
      if (gamesList.firstChild) {
        // btnCreate.disabled = true;
        txtGameId.disabled = true;
      }
    }
    console.log("game successfully created with id " + response.game.id);
  }
  if (response.method === "gamesClosed") {
    while (gamesList.firstChild) {
      gamesList.removeChild(gamesList.firstChild);
    }
    btnCreate.disabled = false;
    txtGameId.disabled = false;
  }
  //update
  if (response.method === "update") {
    if (!response.game.state) {
      return;
    }
    if (startGame) {
      startGame.remove();
    }
    if (endTurn) {
      endTurn.style.display = "flex";
    }

    const currentPlayer = response.game.state["currentPlayer"];
    const diceThrown = response.game.state["diceThrown"];
    const resultaten = response.game.state["results"];
    const selectedResults = response.game.state["selectedResults"] || [];
    const overgeblevenTegels = response.game.state["tegels"];
    const player1Tegels = response.game.state["player1Tegels"];
    const player2Tegels = response.game.state["player2Tegels"];
    const total = response.game.state["total"];
    const player1Id = response.game.state["player1"];
    const player2Id = response.game.state["player2"];
    const ongeldigeWorp = response.game.state["ongeldigeWorp"];
    overgebleven = response.game.state["number"]; //dit moet beter
    const gameOver = response.game.state["gameOver"];
    if (gameOver) {
      const winnaar = response.game.state["winnaar"];
      const score = response.game.state["score"];
      alert(`${winnaar} heeft gewonnen met ${score} punten!!`);
    }
    while (divPlayers.firstChild) divPlayers.removeChild(divPlayers.firstChild);
    const d = document.createElement("span");
    d.textContent = response.game.clients.find(
      (x) => x.clientId === currentPlayer
    ).clientName;
    d.style.color = response.game.clients.find(
      (x) => x.clientId === currentPlayer
    ).color;
    divPlayers.append(d);

    determinePlayer(currentPlayer, diceThrown);
    createDices(resultaten, selectedResults);
    maaktegels(overgeblevenTegels);
    playerTegels(player1Tegels, player2Tegels);
    selectedTegels(selectedResults);

    btnTotal.textContent = total;
    const availableTegels = Array.from(divTegels.children, (x) =>
      parseInt(x.value)
    );
    const xGegooid = selectedResults.map((x) => x.dice).includes("X");
    if (total >= 21 && xGegooid) {
      if (availableTegels.includes(total)) {
        for (tegel of divTegels.children) {
          const tegelWaarde = parseInt(tegel.value);
          if (total === tegelWaarde) {
            tegel.disabled = false;
          }
        }
      } else {
        eerstvolgende = Math.max.apply(
          Math,
          availableTegels.filter((x) => x < total)
        );
        if (eerstvolgende > 1) {
          for (tegel of divTegels.children) {
            if (parseInt(tegel.value) === eerstvolgende) {
              tegel.disabled = false;
            }
          }
        }
        if (
          player1.firstChild &&
          total === parseInt(player1.firstChild.value) &&
          currentPlayer === player2Id &&
          diceThrown === "no"
        ) {
          player1.firstChild.disabled = false;
        }
        if (
          player2.firstChild &&
          total === parseInt(player2.firstChild.value) &&
          currentPlayer === player1Id &&
          diceThrown === "no"
        ) {
          player2.firstChild.disabled = false;
        }
      }
    } else {
      for (tegel of divTegels.children) {
        tegel.disabled = true;
      }
    }
    if (currentPlayer !== clientId || gameOver === true) {
      allButtons = document.querySelectorAll("button");
      allButtons.forEach((button) => (button.disabled = true));
      sendChat.disabled = false;
    }

    if (ongeldigeWorp && currentPlayer === currentPlayer) {
      allButtons = document.querySelectorAll("button");
      allButtons.forEach((button) => (button.disabled = true));
      sendChat.disabled = false;
      endTurn.disabled = false;
    }
    if (resultaten.length === 0 && overgebleven === 0) {
      btnDice.disabled = true;
    }
  }

  //join
  if (response.method === "join") {
    const game = response.game;
    // console.log("currentPlayer".currentPlayer);
    const speeltegels = response.game.state.tegels;
    const titel = document.getElementById("titel");
    if (endTurn) {
      endTurn.style.display = "none";
    }
    if (titel) {
      titel.remove();
    }
    player1Name.textContent = game.clients[0].clientName;
    if (game.clients.length === 2) {
      player2Name.textContent = game.clients[1].clientName;
    }

    while (divPlayers.firstChild) divPlayers.removeChild(divPlayers.firstChild);
    const currentPlayer = response.game.state["currentPlayer"];
    const d = document.createElement("span");
    d.textContent = response.game.clients.find(
      (x) => x.clientId === currentPlayer
    ).clientName;
    d.style.color = response.game.clients.find(
      (x) => x.clientId === currentPlayer
    ).color;
    divPlayers.append(d);

    maaktegels(speeltegels);
    allButtons = document.querySelectorAll("button");
    allButtons.forEach((button) => (button.disabled = true));
    if (clientId === currentPlayer) {
      startGame.disabled = false;
    }
    sendChat.disabled = false;
  }
};

function maaktegels(tegels) {
  while (divTegels.firstChild) {
    divTegels.removeChild(divTegels.firstChild);
  }
  tegels.forEach((tegel) => {
    const b = document.createElement("button");
    b.classList.add("tegeltjes");
    b.value = tegel["waarde"];
    b.textContent = `${tegel["waarde"]} --- ${tegel["punten"]}`;
    b.disabled = true;
    divTegels.append(b);
    b.addEventListener("click", (e) => {
      const payLoad = {
        method: "selectTegel",
        clientId: clientId,
        gameId: gameId,
        selectedTegel: tegel,
      };
      ws.send(JSON.stringify(payLoad));
    });
  });
}

function determinePlayer(currentPlayer, diceThrown) {
  for (let tegel of divBoard.children) {
    if (currentPlayer === clientId) {
      tegel.disabled = false;
    } else {
      tegel.disabled = true;
    }
  }
  if (currentPlayer === clientId) {
    btnDice.disabled = false;

    if (diceThrown === "yes") {
      btnDice.disabled = true;
    } else {
      btnDice.disabled = false;
    }
  }
}

function createDices(resultaten, selectedResults) {
  while (divBoard.firstChild) {
    divBoard.removeChild(divBoard.firstChild);
  }
  for (let i = 0; i < resultaten?.length; i++) {
    const b = document.createElement("button");
    obje = resultaten[i];
    b.id = "tegel" + (i + 1);
    b.tag = i + 1;
    const waarde = obje["value"];
    const text = obje["dice"];
    b.value = waarde;
    b.classList.add(`dice_${text}`);
    b.classList.add("dices");
    if (selectedResults.map((x) => String(x.dice))?.includes(String(text))) {
      b.disabled = true;
    }
    b.addEventListener("click", (e) => {
      const payLoad = {
        method: "selectDice",
        clientId: clientId,
        gameId: gameId,
        selectedValue: { dice: text, value: parseInt(waarde) },
        results: resultaten,
        number: overgebleven,
        selectedResults: selectedResults,
      };
      ws.send(JSON.stringify(payLoad));
    });
    divBoard.append(b);
  }
}
function playerTegels(player1Tegels, player2Tegels) {
  player1Tegels = player1Tegels.reverse();
  while (player1.firstChild) player1.removeChild(player1.firstChild);
  player1Tegels.forEach((tegel) => {
    const b = document.createElement("button");
    waarde = tegel["waarde"];
    b.textContent = `${tegel["waarde"]} --- ${tegel["punten"]}`;
    b.value = waarde;
    b.disabled = true;
    b.classList.add("playerTegels");
    b.addEventListener("click", (e) => {
      const payLoad = {
        method: "stolenTegel",
        clientId: clientId,
        gameId: gameId,
        selectedTegel: tegel,
      };
      ws.send(JSON.stringify(payLoad));
    });
    player1.append(b);
  });
  player2Tegels = player2Tegels.reverse();
  while (player2.firstChild) player2.removeChild(player2.firstChild);
  player2Tegels.forEach((tegel) => {
    const b = document.createElement("button");
    waarde = tegel["waarde"];
    b.textContent = `${tegel["waarde"]} --- ${tegel["punten"]}`;
    b.value = waarde;
    b.disabled = true;
    b.classList.add("playerTegels");
    b.addEventListener("click", (e) => {
      const payLoad = {
        method: "stolenTegel",
        clientId: clientId,
        gameId: gameId,
        selectedTegel: tegel,
      };
      ws.send(JSON.stringify(payLoad));
    });
    player2.append(b);
  });
}

function selectedTegels(selectedResults) {
  while (selectedDice.firstChild) {
    selectedDice.removeChild(selectedDice.firstChild);
  }
  for (let i = 0; i < selectedResults?.length; i++) {
    const b = document.createElement("button");
    obje = selectedResults[i];
    b.value = obje["value"];
    b.classList.add(`dice_${obje["dice"]}`);
    b.classList.add("dices");
    b.disabled = true;
    selectedDice.append(b);
  }
}
