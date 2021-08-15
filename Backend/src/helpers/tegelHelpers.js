export function resetSelectableTegels(state) {
    return { ...state, selectableTegels: [] };
  }
  
  export function determineTegels(state) {
    let results = [];
    const total = state["total"];
    const tegels = state["tegels"];
  
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
    return { ...state, selectableTegels: results };
  }
  
  export function determineSelectableTegels(state) {
    const chosenDices = state["chosenDices"];
    const total = state["total"];
    const penguinThrown = chosenDices.map((x) => x.dice).includes("X");
    let selectableTegels = [];
    if (penguinThrown && total >= 21) {
      selectableTegels = determineTegels(total, tegels);
    }
    return {
      ...state,
      selectableTegels: selectableTegels,
      penguinThrown: penguinThrown,
    };
  }
  
  export function determineStealableTegel(state) {
    const total = state["total"];
    const players = state['players']
    const stealableTegel = players.find(
      (player) => parseInt(player.topTegel.waarde) === total
    );
    return { ...state, stealableTegel: stealableTegel };
  }