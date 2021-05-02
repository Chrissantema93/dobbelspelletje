import Tegel from "./../classes/tegel.js";

export function diceArray(number) {
  let results = [];
  for (let i = 0; i < number; i++) {
    let x = rollDice();
    if (x === 6) {
      results.push({ dice: "X", value: 5 });
    } else {
      results.push({ dice: x, value: x });
    }
  }
  return results;
}

export function rollDice() {
  return Math.ceil(Math.random() * 6);
}

export function checker(results, selectedResults) {
  const resultsDice = results.map((result) => result.dice);
  const selectedResultsDice = selectedResults.map((result) => result.dice);
  const result = resultsDice.every((dice) => {
    return selectedResultsDice.includes(dice);
  });
  return result
}

export function maakTegels() {
  let results = [];
  let punten = 0;
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
    results.push(new Tegel(i, punten));
  }
  return results;
}

export function changeTurn(clientId, players) {
  if (players.length === 1) {
    return clientId;
  }
  const currentTurn = parseInt(
    players.find((player) => player.clientId === clientId).playerOrder
  );
  if (currentTurn === players.length) {
    return players.find((player) => player.playerOrder === 1).clientId;
  } else {
    return players.find((player) => player.playerOrder === currentTurn + 1)
      .clientId;
  }
}

export function determineTegels(total, tegels) {
  let results = [];
  const availableTegels = Array.from(tegels, (x) => parseInt(x.waarde));
  if (availableTegels.includes(total)) {
    results.push(tegels.find((tegel) => parseInt(tegel.waarde) === total));
  } else {
    const eerstvolgende = Math.max.apply(
      Math,
      availableTegels.filter((x) => x < total)
    );
    if (eerstvolgende > 1) {
      results.push(
        tegels.find((tegel) => parseInt(tegel.waarde) === eerstvolgende)
      );
    }
  }
  return results;
}

export function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

export function guid() {
  return (
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
}
