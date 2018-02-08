import React, { Component } from 'react';
import { CSSTransition } from 'react-transition-group';
import { Spinner } from 'components/ui';
import './InlineSpinner.scss';

export const InlineSpinner: React.SFC<{
  active: boolean;
  text?: string;
}> = ({ active, text }) => (
  <CSSTransition in={active} timeout={300} classNames="inline-spinner--fade">
    {/* TODO: when react-transition-group v2.3 releases, use '-done' classes instead of conditional 'active' class https://github.com/reactjs/react-transition-group/issues/274 */}
    <div className={`Calculating-limit small ${active ? 'active' : ''}`}>
      {text}
      <Spinner />
    </div>
  </CSSTransition>
);

interface Props<T> {
  passedProps: T;
  showLoader: boolean;
  loader: React.ReactElement<any>;
  delay: number;
  withProps(props: T): React.ReactElement<any> | null;
}

interface State<T> {
  shouldShowLoader: boolean;
  propsToPass: T;
  waitOnTimeout: boolean;
}

export class DelayLoader<T> extends Component<Props<T>, State<T>> {
  constructor(props: Props<T>) {
    super(props);
    this.state = {
      propsToPass: props.passedProps,
      shouldShowLoader: props.showLoader,
      waitOnTimeout: false
    };
  }

  public componentWillReceiveProps(nextProps: Props<T>) {
    if (this.state.shouldShowLoader === nextProps.showLoader && !this.state.waitOnTimeout) {
      this.setState({ propsToPass: nextProps.passedProps });
    } else if (nextProps.showLoader) {
      this.setState({ shouldShowLoader: true, waitOnTimeout: true });
    } else {
      window.setTimeout(
        () =>
          this.setState({
            propsToPass: nextProps.passedProps,
            shouldShowLoader: false,
            waitOnTimeout: false
          }),
        this.props.delay
      );
    }
  }

  public render() {
    return (
      <>
        {this.state.shouldShowLoader && this.props.loader}{' '}
        {this.props.withProps(this.state.propsToPass)}{' '}
      </>
    );
  }
}
