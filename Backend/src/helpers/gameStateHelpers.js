import { changeDiceThrown, checkValidThrow, createResults, determineTotal, resetDiceSelect } from "./diceHelpers.js";
import { pipe } from "./generalHelpers.js";
import { determineSelectableTegels, determineStealableTegel, resetSelectableTegels } from "./tegelHelpers.js";

export function resetState(state) {
  return {
    ...state,
    diceThrown: false,
    ongeldigeWorp: false,
    results: [],
    dicesLeft: 8,
    total: 0,
    chosenDices: [],
  };
}





export function handleDiceThrow(state) {
  return pipe(
    createResults,
    changeDiceThrown,
    checkValidThrow,
    resetSelectableTegels
  )(state);
}

export function handleDiceSelect(state, selectedValue) {
  const newState = determineSelectedDices(state, selectedValue);
  return pipe(
    determineTotal,
    determineSelectableTegels,
    determineStealableTegel,
    resetDiceSelect
  )(newState);
}
