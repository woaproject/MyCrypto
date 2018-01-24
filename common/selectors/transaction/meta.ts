import { AppState } from 'reducers';
import { getTransactionState } from './transaction';
import { getDecimalFromEtherUnit, isEtherUnit } from 'libs/units';
import { getToken } from 'selectors/wallet';

function getMetaState(state: AppState) {
  return getTransactionState(state).meta;
}

function getFrom(state: AppState) {
  return getMetaState(state).from;
}

function getDecimal(state: AppState) {
  return getMetaState(state).decimal;
}

function getTokenTo(state: AppState) {
  return getMetaState(state).tokenTo;
}

function getTokenValue(state: AppState) {
  return getMetaState(state).tokenValue;
}

function getUnit(state: AppState) {
  return getMetaState(state).unit;
}

function getPreviousUnit(state: AppState) {
  return getMetaState(state).previousUnit;
}

function getDecimalFromUnit(state: AppState, unit: string) {
  if (isEtherUnit(unit)) {
    return getDecimalFromEtherUnit('ether');
  } else {
    const token = getToken(state, unit);
    if (!token) {
      throw Error(`Token ${unit} not found`);
    }
    return token.decimal;
  }
}

export {
  getFrom,
  getDecimal,
  getTokenValue,
  getTokenTo,
  getUnit,
  getPreviousUnit,
  getDecimalFromUnit
};
