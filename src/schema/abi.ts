import { Interface } from 'ethers'

const converterAbi = [
  'function converter(bytes calldata data) external pure returns (bytes memory)',
]

const agentProxyAbi = [
  {
    inputs: [{
      components: [
        { name: 'signers', type: 'address[]' },
        { name: 'threshold', type: 'uint8' },
        { name: 'converterAddress', type: 'address' },
        {
          components: [
            { name: 'version', type: 'string' },
            { name: 'messageId', type: 'string' },
            { name: 'sourceAgentId', type: 'string' },
            { name: 'sourceAgentName', type: 'string' },
            { name: 'targetAgentId', type: 'string' },
            { name: 'timestamp', type: 'uint256' },
            { name: 'messageType', type: 'uint8' },
            { name: 'priority', type: 'uint8' },
            { name: 'ttl', type: 'uint256' },
          ],
          name: 'agentHeader',
          type: 'tuple',
        },
      ],
      name: 'agentSettings',
      type: 'tuple',
    }],
    name: 'createAndRegisterAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'agent', type: 'address' },
      { name: 'settingsDigest', type: 'bytes32' },
      {
        components: [
          { name: 'data', type: 'bytes' },
          { name: 'dataHash', type: 'bytes32' },
          {
            components: [
              { name: 'zkProof', type: 'bytes' },
              { name: 'merkleProof', type: 'bytes' },
              { name: 'signatureProof', type: 'bytes' },
            ],
            name: 'proofs',
            type: 'tuple',
          },
          {
            components: [
              { name: 'contentType', type: 'string' },
              { name: 'encoding', type: 'string' },
              { name: 'compression', type: 'string' },
            ],
            name: 'metadata',
            type: 'tuple',
          },
        ],
        name: 'payload',
        type: 'tuple',
      },
    ],
    name: 'verify',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  'function agentManager() external view override returns (address)',
]

const agentManagerAbi = [
  'function agentVersion() external pure returns (string memory)',
  'function isValidMessageId(string memory messageId) external pure returns (bool)',
  'function isValidSourceAgentId(string memory sourceAgentId) external view returns (bool)',
]

const AgentRegisteredAbi = {
  type: 'event',
  name: 'AgentRegistered',
  inputs: [
    { name: 'agent', type: 'address', indexed: true },
    {
      name: 'agentSettings',
      type: 'tuple',
      components: [
        { name: 'signers', type: 'address[]' },
        { name: 'threshold', type: 'uint8' },
        { name: 'converterAddress', type: 'address' },
        {
          name: 'agentHeader',
          type: 'tuple',
          components: [
            { name: 'version', type: 'string' },
            { name: 'messageId', type: 'string' },
            { name: 'sourceAgentId', type: 'string' },
            { name: 'sourceAgentName', type: 'string' },
            { name: 'targetAgentId', type: 'string' },
            { name: 'timestamp', type: 'uint256' },
            { name: 'messageType', type: 'uint8' },
            { name: 'priority', type: 'uint8' },
            { name: 'ttl', type: 'uint256' },
          ],
        },
      ],
    },
  ],
}

const iface = new Interface([AgentRegisteredAbi])
const AgentRegisteredTopic = iface.getEvent('AgentRegistered')!.topicHash

export {
  agentManagerAbi,
  agentProxyAbi,
  AgentRegisteredTopic,
  converterAbi,
}
