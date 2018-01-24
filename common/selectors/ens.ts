import { AppState } from 'reducers';
import { IOwnedDomainRequest, IBaseDomainRequest } from 'libs/ens';
import { REQUEST_STATES } from 'reducers/ens/domainRequests';
import { isCreationAddress } from 'libs/validators';

export function getEns(state: AppState) {
  return state.ens;
}

export function getCurrentDomainName(state: AppState) {
  return getEns(state).domainSelector.currentDomain;
}

export function getDomainRequests(state: AppState) {
  return getEns(state).domainRequests;
}

export function getCurrentDomainData(state: AppState) {
  const currentDomain = getCurrentDomainName(state);
  const domainRequests = getDomainRequests(state);

  if (!currentDomain || !domainRequests[currentDomain] || domainRequests[currentDomain].error) {
    return null;
  }

  const domainData = domainRequests[currentDomain].data || null;

  return domainData;
}

export function getResolvedAddress(state: AppState, noGenesisAddress: boolean = false) {
  const data = getCurrentDomainData(state);
  if (!data) {
    return null;
  }

  if (isOwned(data)) {
    const { resolvedAddress } = data;
    if (noGenesisAddress) {
      return !isCreationAddress(resolvedAddress) ? resolvedAddress : null;
    }
    return data.resolvedAddress;
  }
  return null;
}

export function getResolvingDomain(state: AppState) {
  const currentDomain = getCurrentDomainName(state);
  const domainRequests = getDomainRequests(state);

  if (!currentDomain || !domainRequests[currentDomain]) {
    return null;
  }

  return domainRequests[currentDomain].state === REQUEST_STATES.pending;
}

const isOwned = (data: IBaseDomainRequest): data is IOwnedDomainRequest => {
  return !!(data as IOwnedDomainRequest).ownerAddress;
};
