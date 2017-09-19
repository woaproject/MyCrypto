// @flow
import DeterministicWallet from './deterministic';
import EthTx from 'ethereumjs-tx';
import DigitalBitboxEth from 'vendor/digital-bitbox-eth';
import type { RawTransaction } from 'libs/transaction';

export default class DigitalBitboxWallet extends DeterministicWallet {
  signRawTransaction(tx: RawTransaction): Promise<string> {
    return new Promise((resolve, reject) => {});
  }

  static parseErrorObject(err: Object): string {
    if (err.errorCode) {
      // u2f error, codes explained here:
      // https://developers.yubico.com/U2F/Libraries/Client_error_codes.html
      switch (err.errorCode) {
        case 3:
          return 'Your configuration is not supported';

        case 4:
          return 'Incorrect device for this wallet';

        case 5:
          return 'Authentication timed out, please try again';

        case 1:
        case 2:
        default:
          return 'Unknown error, please try again';
      }
    } else {
      // DigitalBitbox error
      return DigitalBitboxEth.parseError(err);
    }
  }
}
