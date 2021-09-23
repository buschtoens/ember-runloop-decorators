declare const config: ReturnType<typeof import('../../config/environment')> & {
  // Injected at build time by addons.
  APP: {
    name: string;
    version: string;
  };
};
export default config;
