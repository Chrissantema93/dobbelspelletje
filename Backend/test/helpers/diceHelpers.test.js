import { expect } from "chai";
import { changeDiceThrown, resetDiceSelect } from "../../src/helpers/diceHelpers.js";

describe('#changeDiceThrown()', function () {
    let stateWithFalseDiceThrown = {diceThrown : false}
    let stateWithTrueDiceThrown = {diceThrown : true}

    it('should change the diceThrown variable from false to true', function() {
        expect(changeDiceThrown(stateWithFalseDiceThrown)).to.deep.equal(stateWithTrueDiceThrown)
    }),
    it('should change the diceThrown variable from true to false', function() {
        expect(changeDiceThrown(stateWithTrueDiceThrown)).to.deep.equal(stateWithFalseDiceThrown)
    })
    
})

describe('#resetDiceSelect()', function () {
    let stateWithValues = {results: [1,2], ongeldigeWorp: true, diceThrown: true}
    let stateWithDefaults = {results: [], ongeldigeWorp: false, diceThrown: false}

    it('should reset the state to their defaults', function() {
        expect(resetDiceSelect(stateWithValues)).to.deep.equal(stateWithDefaults)
    })
})
