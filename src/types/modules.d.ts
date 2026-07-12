// pnpm strict mode does not hoist @tsparticles/engine to
// node_modules/@tsparticles/. The Vite dev server and bundler resolve
// it fine at runtime through the .pnpm store. This declaration tells
// TypeScript the module exists so astro check passes.
declare module '@tsparticles/engine' {
  export * from '.pnpm/@tsparticles+engine@4.3.1/node_modules/@tsparticles/engine/types/index';
  export { tsParticles } from '.pnpm/@tsparticles+engine@4.3.1/node_modules/@tsparticles/engine/types/index';
}
