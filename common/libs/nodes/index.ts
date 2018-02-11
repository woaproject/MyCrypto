import { INode } from 'libs/nodes/INode';
import PRPCNode from './rpc';
import PInfuraNode from './infura';
import PEtherscanNode from './etherscan';
import PCustomNode from './custom';
import PWeb3Node from './web3';
import { nodeCallRequester } from 'sagas/node/node';

const handler: ProxyHandler<INode> = {
  get: (target, methodName: string) => {
    const nodeMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(target));
    if (nodeMethods.includes(methodName)) {
      return nodeCallRequester(methodName);
    }
  }
};

const createNode = (ctor: any, args: any) => {
  const instance = new ctor(...args);
  return new Proxy(instance, handler);
};

const obj = {
  RPCNode: PRPCNode,
  InfuraNode: PInfuraNode,
  EtherscanNode: PEtherscanNode,
  CustomNode: PCustomNode,
  Web3Node: PWeb3Node
};

interface INodeInterfaces {
  RPCNode: typeof PRPCNode;
  InfuraNode: typeof PInfuraNode;
  EtherscanNode: typeof PEtherscanNode;
  CustomNode: typeof PCustomNode;
  Web3Node: typeof PWeb3Node;
}

const x = Object.entries(obj).reduce(
  (acc, [key, value]) => {
    return {
      ...acc,
      [key](...args) {
        return createNode(value, args);
      }
    };
  },
  {} as INodeInterfaces
);

const { CustomNode, EtherscanNode, InfuraNode, RPCNode, Web3Node } = x;
export { CustomNode, EtherscanNode, InfuraNode, RPCNode, Web3Node };
