const createAndRegisterAgentAbi = [
  {
    inputs: [{
      components: [
        {
          name: 'signers',
          type: 'address[]',
        },
        {
          name: 'threshold',
          type: 'uint8',
        },
        {
          name: 'converterAddress',
          type: 'address',
        },
        {
          components: [
            {
              name: 'version',
              type: 'string',
            },
            {
              name: 'messageId',
              type: 'string',
            },
            {
              name: 'sourceAgentId',
              type: 'string',
            },
            {
              name: 'sourceAgentName',
              type: 'string',
            },
            {
              name: 'targetAgentId',
              type: 'string',
            },
            {
              name: 'timestamp',
              type: 'uint256',
            },
            {
              name: 'messageType',
              type: 'uint8',
            },
            {
              name: 'priority',
              type: 'uint8',
            },
            {
              name: 'ttl',
              type: 'uint256',
            },
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
]

const verifyAbi = [
  {
    inputs: [
      {
        name: 'agent',
        type: 'address',
      },
      {
        name: 'settingsDigest',
        type: 'bytes32',
      },
      {
        components: [
          {
            name: 'data',
            type: 'bytes',
          },
          {
            name: 'dataHash',
            type: 'bytes32',
          },
          {
            components: [
              {
                name: 'zkProof',
                type: 'bytes',
              },
              {
                name: 'merkleProof',
                type: 'bytes',
              },
              {
                name: 'signatureProof',
                type: 'bytes',
              },
            ],
            name: 'proofs',
            type: 'tuple',
          },
          {
            components: [
              {
                name: 'contentType',
                type: 'string',
              },
              {
                name: 'encoding',
                type: 'string',
              },
              {
                name: 'compression',
                type: 'string',
              },
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
]

const converterAbi = [
  'function converter(bytes calldata data) external pure returns (bytes memory)',
]

export {
  converterAbi,
  createAndRegisterAgentAbi,
  verifyAbi,
}
