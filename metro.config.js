const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const frontendNodeModules = path.resolve(projectRoot, 'frontend/node_modules');

const config = getDefaultConfig(projectRoot);

// Ensure all dependencies resolve to frontend/node_modules so no duplicate react-native exists
// Metro's default hierarchical lookup can still walk up and find root/node_modules,
// which contains a second React installation and causes invalid hook calls on web.
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [
  frontendNodeModules,
];

// Deduplicate singletons like react, react-native, and expo
config.resolver.extraNodeModules = new Proxy({}, {
  get: (target, name) => path.join(frontendNodeModules, name),
});

// Block root node_modules/react-native and root node_modules/react from being bundled
config.resolver.blockList = [
  new RegExp(`^${path.resolve(projectRoot, 'node_modules/react-native')}/.*`),
  new RegExp(`^${path.resolve(projectRoot, 'node_modules/react')}/.*`),
];

module.exports = config;
