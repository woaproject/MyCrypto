// @flow
import './DigitalBitbox.scss';
import React, { Component } from 'react';
import translate, { translateRaw } from 'translations';
import DigitalBitboxWallet from 'libs/wallet/digitalbitbox';
import DigitalBitboxUsb from 'vendor/digital-bitbox-usb';
import DigitalBitboxEth from 'vendor/digital-bitbox-eth';
import DPATHS from 'config/dpaths.js';
const DEFAULT_PATH = DPATHS.DIGITAL_BITBOX[0].value;

type State = {
  password: string,
  dPath: string,
  error: ?string,
  isLoading: boolean
};

export default class DigitalBitbox extends Component {
  state: State = {
    password: '',
    dPath: DEFAULT_PATH,
    error: null,
    isLoading: false
  };

  _handlePasswordChange = (ev: SyntheticInputEvent) => {
    this.setState({ password: ev.target.value });
  };

  _handleConnect = (ev: SyntheticInputEvent) => {
    ev.preventDefault();
    const { password, dPath } = this.state;
    const dbusb = new DigitalBitboxUsb();
    const dbeth = new DigitalBitboxEth(dbusb, password);
    console.log(dbeth);
    dbeth.getAddress(dPath, (res, err) => {
      console.log(err);
      if (err) {
        this.setState({ error: DigitalBitboxWallet.parseErrorObject(err) });
        return;
      }

      console.log(res, 'res');
    });
  };

  render() {
    const { password, isLoading, error } = this.state;
    const showErr = error ? 'is-showing' : '';
    const pwPlaceholder = `${translateRaw('x_DigitalBitbox')}${translateRaw(
      'x_Password'
    )}`;

    return (
      <section className="DigitalBitbox col-md-4 col-sm-6">
        <form onSubmit={this._handleConnect}>
          <button
            className="DigitalBitbox-connect btn btn-primary btn-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Unlocking...' : translate('ADD_DigitalBitbox_scan')}
          </button>
          <input
            className="DigitablBitbox-password form-control"
            type="password"
            value={password}
            placeholder={pwPlaceholder}
            onChange={this._handlePasswordChange}
          />
        </form>

        <div className={`DigitalBitbox-error alert alert-danger ${showErr}`}>
          {error
            ? <span
                dangerouslySetInnerHTML={{
                  __html: error
                }}
              />
            : '-'}
        </div>

        <div className="DigitalBitbox-help">
          Guide:{' '}
          <a
            href="https://digitalbitbox.com/ethereum"
            target="_blank"
            rel="noopener"
          >
            How to use DigitalBitbox with MyEtherWallet
          </a>
        </div>

        <a
          className="DigitalBitbox-buy btn btn-sm btn-default"
          href="https://digitalbitbox.com/?ref=mew"
          target="_blank"
          rel="noopener"
        >
          {translate('Need a DigitalBitbox? Buy one today!')}
        </a>

        {/*<DeterministicWalletsModal
          isOpen={!!publicKey && !!chainCode}
          publicKey={publicKey}
          chainCode={chainCode}
          dPath={dPath}
          dPaths={DPATHS.TREZOR}
          onCancel={this._handleCancel}
          onConfirmAddress={this._handleUnlock}
          onPathChange={this._handlePathChange}
          walletType={translate('x_Trezor', true)}
        />*/}
      </section>
    );
  }
}
