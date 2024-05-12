declare module "../../../src/types/config.js" {
  interface FooUserConfig {
    bar?: number | number[];
  }

  interface FooConfig {
    bar: number[];
  }

  interface HardhatUserConfig {
    privateKey?: SensitiveString;
    foo?: FooUserConfig;
  }

  interface HardhatConfig {
    privateKey?: ResolvedConfigurationVariable;
    foo: FooConfig;
  }
}
