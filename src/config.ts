import { HardhatConfig } from 'hardhat/types'

import { _0xwebConfig } from './types'

export function resolveConfig(config: HardhatConfig): _0xwebConfig {
  const defaultConfig: _0xwebConfig = {
  }

  return {
    ...defaultConfig,
    ...(config['0xweb'] ?? {}),
  };
}
