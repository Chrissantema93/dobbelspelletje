import Tegel from "../models/tegelModel.js";

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
  let result = false;
  if(selectedResults > 0){
  const resultsDice = results.map((result) => result.dice);
  const selectedResultsDice = selectedResults.map((result) => result.dice);
   result = resultsDice.every((dice) => {
    return selectedResultsDice.includes(dice);
  }); }
  return result;
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

export const pipe = (...funcs) => v => {
  return funcs.reduce((res, func) => {
    return func(res);
  }, v);
};
