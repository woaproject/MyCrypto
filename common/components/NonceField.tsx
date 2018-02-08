import React from 'react';
import { NonceFieldFactory } from 'components/NonceFieldFactory';
import Help from 'components/ui/Help';
import RefreshIcon from 'assets/images/refresh.svg';
import './NonceField.scss';
import { InlineSpinner, DelayLoader } from 'components/ui/InlineSpinner';
import { connect } from 'react-redux';
import { getNonceRequested, TGetNonceRequested } from 'actions/transaction';
import { nonceRequestPending } from 'selectors/transaction';
import { AppState } from 'reducers';

interface OwnProps {
  alwaysDisplay: boolean;
}

interface StateProps {
  nonePending: boolean;
}

interface DispatchProps {
  requestNonce: TGetNonceRequested;
}

type Props = OwnProps & DispatchProps & StateProps;

class NonceField extends React.Component<Props> {
  public render() {
    const { alwaysDisplay, requestNonce, nonePending } = this.props;

    const X = ({ value, raw, readOnly, onChange }) => (
      <div className="nonce-input-wrapper">
        <input
          className={`form-control nonce-input ${!!value ? 'is-valid' : 'is-invalid'}`}
          type="number"
          placeholder="e.g. 7"
          value={raw}
          readOnly={readOnly}
          onChange={onChange}
        />
        <button className="nonce-refresh" onClick={requestNonce}>
          <img src={RefreshIcon} alt="refresh" />
        </button>
      </div>
    );

    return (
      <NonceFieldFactory
        withProps={({ nonce: { raw, value }, onChange, readOnly, shouldDisplay }) => {
          return alwaysDisplay || shouldDisplay ? (
            <React.Fragment>
              <div className="nonce-label-wrapper flex-wrapper">
                <label className="nonce-label">Nonce</label>
                <Help
                  size={'x1'}
                  link={
                    'https://myetherwallet.github.io/knowledge-base/transactions/what-is-nonce.html'
                  }
                />
                <DelayLoader
                  delay={1500}
                  loader={
                    <>
                      <InlineSpinner active={true} text="Calculating" />
                      <div className="flex-spacer" />
                    </>
                  }
                  passedProps={{ value, raw, readOnly, onChange }}
                  showLoader={nonePending}
                  withProps={p => <X {...p} />}
                />
              </div>
            </React.Fragment>
          ) : null;
        }}
      />
    );
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    nonePending: nonceRequestPending(state)
  };
};

export default connect(mapStateToProps, { requestNonce: getNonceRequested })(NonceField);
