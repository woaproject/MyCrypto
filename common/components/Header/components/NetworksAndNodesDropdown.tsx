import {
  TChangeNodeIntent,
  TAddCustomNode,
  TRemoveCustomNode,
  TAddCustomNetwork,
  AddCustomNodeAction,
  changeNodeIntent,
  addCustomNode,
  removeCustomNode,
  addCustomNetwork,
  changeNetwork,
  TChangeNetwork
} from 'actions/config';
import { ColorDropdown } from 'components/ui';
import React, { Component } from 'react';
import classnames from 'classnames';
import CustomNodeModal from './CustomNodeModal';
import { NodeConfig } from 'types/node';
import { AppState } from 'reducers';
import {
  isNodeChanging,
  getNodeId,
  getNodeConfig,
  CustomNodeOption,
  NodeOption,
  getNodeOptions,
  getNetworkOptions,
  NetworkOptions,
  getSelectedNetwork
} from 'selectors/config';
import { connect } from 'react-redux';
import { isManual } from 'selectors/nodeBalancer';

interface DispatchProps {
  changeNetwork: TChangeNetwork;
  changeNodeIntent: TChangeNodeIntent;
  addCustomNode: TAddCustomNode;
  removeCustomNode: TRemoveCustomNode;
  addCustomNetwork: TAddCustomNetwork;
}

interface StateProps {
  networkOptions: NetworkOptions;
  isBalancerOnManual: boolean;
  currentNetworkId: string;
  node: NodeConfig;
  nodeSelection: AppState['config']['nodes']['selectedNode']['nodeId'];
  isChangingNode: AppState['config']['nodes']['selectedNode']['pending'];
  nodeOptions: (CustomNodeOption | NodeOption)[];
}

const mapStateToProps = (state: AppState): StateProps => ({
  isBalancerOnManual: isManual(state),
  networkOptions: getNetworkOptions(state),
  isChangingNode: isNodeChanging(state),
  nodeSelection: getNodeId(state),
  node: getNodeConfig(state),
  nodeOptions: getNodeOptions(state),
  currentNetworkId: getSelectedNetwork(state)
});

const mapDispatchToProps: DispatchProps = {
  changeNetwork,
  changeNodeIntent,
  addCustomNode,
  removeCustomNode,
  addCustomNetwork
};

interface State {
  isAddingCustomNode: boolean;
}

type Props = StateProps & DispatchProps;

class DropDown extends Component<Props, State> {
  public state: State = {
    isAddingCustomNode: false
  };

  public render() {
    const {
      node,
      nodeSelection,
      isChangingNode,
      nodeOptions,
      currentNetworkId,
      networkOptions,
      isBalancerOnManual
    } = this.props;
    const { isAddingCustomNode } = this.state;

    const nodeOpts = nodeOptions.map(n => {
      if (n.isCustom) {
        const { name: { networkId, nodeId }, isCustom, id, ...rest } = n;
        return {
          ...rest,
          name: (
            <span>
              {networkId} - {nodeId} <small>(custom)</small>
            </span>
          ),
          onRemove: () => this.props.removeCustomNode({ id })
        };
      } else {
        const { name: { networkId, service }, isCustom, ...rest } = n;
        return {
          ...rest,
          name: (
            <span>
              {networkId} <small>({service})</small>
            </span>
          )
        };
      }
    });

    const networkOpts = networkOptions.map(n => {
      const { networkId } = n;
      return {
        value: n.networkId,
        name: (
          <span>
            {networkId} <small>{n.isCustom ? '(custom)' : ''}</small>
          </span>
        )
        // onRemove: () => this.props.removeCustomNode({ id })
      };
    });

    const addCustomNodeItem = (
      <li>
        <a onClick={this.openCustomNodeModal}>Add Custom Node</a>
      </li>
    );

    const nodeDropDown = (
      <ColorDropdown
        ariaLabel={`
            change node. current node is on the ${node.network} network
            provided by ${node.service}
          `}
        options={nodeOpts}
        value={nodeSelection}
        extra={
          <>
            {addCustomNodeItem}
            <li>
              <a onClick={() => {}}> Switch to auto network mode </a>
            </li>
          </>
        }
        disabled={nodeSelection === 'web3'}
        onChange={this.props.changeNodeIntent}
        size="smr"
        color="white"
        menuAlign="right"
      />
    );
    const networkDropDown = (
      <ColorDropdown
        ariaLabel={``}
        options={networkOpts}
        value={currentNetworkId}
        extra={
          <>
            {addCustomNodeItem}
            <li>
              <a onClick={() => {}}> Switch to manual node selection </a>
            </li>>
          </>
        }
        disabled={nodeSelection === 'web3'}
        onChange={(networkId: string) => {
          this.props.changeNetwork({ networkId });
        }}
        size="smr"
        color="white"
        menuAlign="right"
      />
    );
    return (
      <>
        <div
          className={classnames({
            'Header-branding-right-dropdown': true,
            'is-flashing': isChangingNode
          })}
        >
          {isBalancerOnManual ? nodeDropDown : networkDropDown}
        </div>

        {isAddingCustomNode && (
          <CustomNodeModal
            addCustomNode={this.addCustomNode}
            handleClose={this.closeCustomNodeModal}
          />
        )}
      </>
    );
  }

  private openCustomNodeModal = () => {
    this.setState({ isAddingCustomNode: true });
  };

  private closeCustomNodeModal = () => {
    this.setState({ isAddingCustomNode: false });
  };

  private addCustomNode = (payload: AddCustomNodeAction['payload']) => {
    this.setState({ isAddingCustomNode: false });
    this.props.addCustomNode(payload);
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DropDown);
