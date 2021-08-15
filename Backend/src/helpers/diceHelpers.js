export function resetDiceSelect(state) {
    return {...state, 
    results: [],
    ongeldigeWorp: false,
    diceThrown: false
  }
}

export function changeDiceThrown(state) {
    return { ...state, diceThrown: !state["diceThrown"] };
  }

export function determineTotal(state) {
  let total = 0;
  const chosenDices = state["chosenDices"];
  if (chosenDices.length > 0) {
    let arr = chosenDices.map((x) => parseInt(x.waarde));
    total = arr.reduce((a, b) => a + b);
  }
  return { ...state, total: total };
}

export function checkValidThrow(state) {
  return {
    ...state,
    ongeldigeWorp: checker(state["results"], state["chosenDices"]),
  };
}

export function determineSelectedDices(state, selectedValue) {
  const results = state["results"];
  const dicesLeft = state["dicesLeft"];
  let chosenDices = [];
  let hoeveelheid = 0;
  for (let i = 0; i < dicesLeft; i++) {
    if (String(results[i]["dice"]) === String(selectedValue["dice"])) {
      chosenDices.push(selectedValue);
      hoeveelheid++;
    }
  }
  const overgebleven = dicesLeft - hoeveelheid;
  return { ...state, chosenDices: chosenDices, dicesLeft: overgebleven };
}

export function createResults(state) {
  return { ...state, results: diceArray(state["dicesLeft"]) };
}

