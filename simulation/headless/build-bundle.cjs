// 打包 src/core 为单个 CJS bundle，供 Node headless 模拟使用
const path = require('path');
const esbuild = require(path.join(
  'C:/Users/28705/Documents/trae_projects/project4',
  'node_modules/.pnpm/esbuild@0.25.0/node_modules/esbuild/lib/main.js'
));

esbuild.build({
  entryPoints: ['C:/Users/28705/Documents/trae_projects/project4/simulation/headless/core-entry.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'C:/Users/28705/Documents/trae_projects/project4/simulation/headless/core.bundle.cjs',
  external: ['react', 'react-dom'],
  // immer 需要打包进来（CJS 互操作）
  logLevel: 'info',
}).catch((e) => { console.error(e); process.exit(1); });
