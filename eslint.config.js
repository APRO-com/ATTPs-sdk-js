// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    rules: {
      'curly': 'off',
      'antfu/no-top-level-await': 'off',
      'no-console': 'off',
      'ts/explicit-function-return-type': 'off',
    },
  },
)
