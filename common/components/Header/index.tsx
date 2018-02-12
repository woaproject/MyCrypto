import { TChangeLanguage, changeLanguage } from 'actions/config';
import logo from 'assets/images/logo-mycrypto.svg';
import { Dropdown } from 'components/ui';
import React, { Component } from 'react';
import classnames from 'classnames';
import { Link } from 'react-router-dom';
import { TSetGasPriceField, setGasPriceField } from 'actions/transaction';
import { ANNOUNCEMENT_MESSAGE, ANNOUNCEMENT_TYPE, languages } from 'config';
import Navigation from './components/Navigation';

import OnlineStatus from './components/OnlineStatus';
import { getKeyByValue } from 'utils/helpers';

import './index.scss';
import { AppState } from 'reducers';
import {
  getOffline,
  isNodeChanging,
  getLanguageSelection,
  getNetworkConfig
} from 'selectors/config';
import { NetworkConfig } from 'types/network';
import { connect } from 'react-redux';
import NetworksAndNodesDropdown from 'components/Header/components/NetworksAndNodesDropdown';

interface DispatchProps {
  changeLanguage: TChangeLanguage;
  setGasPriceField: TSetGasPriceField;
}

interface StateProps {
  network: NetworkConfig;
  languageSelection: AppState['config']['meta']['languageSelection'];
  isChangingNode: AppState['config']['nodes']['selectedNode']['pending'];
  isOffline: AppState['config']['meta']['offline'];
}

const mapStateToProps = (state: AppState): StateProps => ({
  isOffline: getOffline(state),
  isChangingNode: isNodeChanging(state),
  languageSelection: getLanguageSelection(state),
  network: getNetworkConfig(state)
});

const mapDispatchToProps: DispatchProps = {
  setGasPriceField,
  changeLanguage
};

type Props = StateProps & DispatchProps;

class Header extends Component<Props> {
  public render() {
    const { languageSelection, isChangingNode, isOffline, network } = this.props;

    const selectedLanguage = languageSelection;
    const LanguageDropDown = Dropdown as new () => Dropdown<typeof selectedLanguage>;

    return (
      <div className="Header">
        {ANNOUNCEMENT_MESSAGE && (
          <div className={`Header-announcement is-${ANNOUNCEMENT_TYPE}`}>
            {ANNOUNCEMENT_MESSAGE}
          </div>
        )}

        <section className="Header-branding">
          <section className="Header-branding-inner container">
            <Link to="/" className="Header-branding-title" aria-label="Go to homepage">
              <img
                className="Header-branding-title-logo"
                src={logo}
                height="64px"
                width="245px"
                alt="MyCrypto logo"
              />
            </Link>
            <div className="Header-branding-right">
              <div className="Header-branding-right-online">
                <OnlineStatus isOffline={isOffline} />
              </div>

              <div className="Header-branding-right-dropdown">
                <LanguageDropDown
                  ariaLabel={`change language. current language ${languages[selectedLanguage]}`}
                  options={Object.values(languages)}
                  value={languages[selectedLanguage]}
                  extra={
                    <li key="disclaimer">
                      <a data-toggle="modal" data-target="#disclaimerModal">
                        Disclaimer
                      </a>
                    </li>
                  }
                  onChange={this.changeLanguage}
                  size="smr"
                  color="white"
                />
              </div>

              <div
                className={classnames({
                  'Header-branding-right-dropdown': true,
                  'is-flashing': isChangingNode
                })}
              >
                <NetworksAndNodesDropdown />
              </div>
            </div>
          </section>
        </section>

        <Navigation color={!network.isCustom && network.color} />
      </div>
    );
  }

  public changeLanguage = (value: string) => {
    const key = getKeyByValue(languages, value);
    if (key) {
      this.props.changeLanguage(key);
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);
