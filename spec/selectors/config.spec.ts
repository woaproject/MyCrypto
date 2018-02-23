import { getNetworkContracts, getAllTokens } from 'selectors/config';
import { getInitialState, testShallowlyEqual } from './helpers';

describe('selectors/config', () => {
  describe('getNetworkContracts', () => {
    const noContractsState = getInitialState();
    noContractsState.config = {
      ...noContractsState.config,
      networks: {
        ...noContractsState.config.networks,
        staticNetworks: {
          ...noContractsState.config.networks.staticNetworks,
          ETH: {
            ...noContractsState.config.networks.staticNetworks.ETH,
            contracts: []
          }
        }
      }
    };

    it('should return network contracts when there are some', () => {
      const contractsState = getInitialState();
      contractsState.config = {
        ...noContractsState.config,
        networks: {
          ...noContractsState.config.networks,
          staticNetworks: {
            ...noContractsState.config.networks.staticNetworks,
            ETH: {
              ...noContractsState.config.networks.staticNetworks.ETH,
              contracts: [
                {
                  name: 'test',
                  address: 'test',
                  abi: 'test'
                }
              ]
            }
          }
        }
      };
      const contracts = getNetworkContracts(contractsState);
      expect(contracts).toEqual(contractsState.config.networks.staticNetworks.ETH.contracts);
    });

    it('should return an empty array when there’re no network contracts', () => {
      const noContracts = getNetworkContracts(noContractsState);
      expect(noContracts).toBeTruthy();
      expect(noContracts).toHaveLength(0);
    });

    testShallowlyEqual(
      getNetworkContracts(noContractsState),
      getNetworkContracts(noContractsState)
    );
  });

  describe('getAllTokens', () => {
    const allTokensState = getInitialState();
    allTokensState.config = {
      ...allTokensState.config,
      networks: {
        ...allTokensState.config.networks,
        staticNetworks: {
          ...allTokensState.config.networks.staticNetworks,
          ETH: {
            ...allTokensState.config.networks.staticNetworks.ETH,
            tokens: [
              {
                address: 'test',
                symbol: 'TEST',
                decimal: 18
              }
            ]
          }
        }
      }
    };
    allTokensState.customTokens = [
      {
        address: 'also test',
        symbol: 'TEST2',
        decimal: 18
      }
    ];
    const allTokens = getAllTokens(allTokensState);

    it('should return network tokens + custom tokens, custom tokens last', () => {
      expect(allTokens).toEqual(
        allTokensState.config.networks.staticNetworks.ETH.tokens.concat(allTokensState.customTokens)
      );
    });

    testShallowlyEqual(allTokens, getAllTokens(allTokensState));
  });
});
