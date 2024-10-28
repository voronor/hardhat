import type { HardhatRuntimeEnvironment } from "../../../../../src/types/hre.js";
import type {
  HardhatConfig,
  HardhatUserConfig,
} from "@ignored/hardhat-vnext/types/config";

import assert from "node:assert/strict";
import { before, describe, it } from "node:test";

import { createHardhatRuntimeEnvironment } from "../../../../../src/hre.js";
import {
  extendUserConfig,
  resolveUserConfig,
} from "../../../../../src/internal/builtin-plugins/network-manager/hook-handlers/config.js";
import { validateUserConfig } from "../../../../../src/internal/builtin-plugins/network-manager/type-validation.js";
import { ResolvedConfigurationVariableImplementation } from "../../../../../src/internal/core/configuration-variables.js";

describe("network-manager/hook-handlers/config", () => {
  describe("extendUserConfig", () => {
    it("should extend the user config with the localhost network", async () => {
      const config: HardhatUserConfig = {};
      const next = async (nextConfig: HardhatUserConfig) => nextConfig;

      const extendedConfig = await extendUserConfig(config, next);
      assert.ok(
        extendedConfig.networks?.localhost !== undefined,
        "localhost network should be defined",
      );
      assert.deepEqual(extendedConfig.networks?.localhost, {
        url: "http://localhost:8545",
        type: "http",
      });
    });

    it("should allow setting other properties of the localhost network", async () => {
      const config: HardhatUserConfig = {
        networks: {
          localhost: {
            url: "http://localhost:8545",
            type: "http",
            timeout: 10_000,
          },
        },
      };
      const next = async (nextConfig: HardhatUserConfig) => nextConfig;

      const extendedConfig = await extendUserConfig(config, next);
      assert.deepEqual(extendedConfig.networks?.localhost, {
        url: "http://localhost:8545",
        type: "http",
        timeout: 10_000,
      });
    });

    it("should allow overriding the url of the localhost network", async () => {
      const config: HardhatUserConfig = {
        networks: {
          localhost: {
            url: "http://localhost:1234",
            type: "http",
          },
        },
      };
      const next = async (nextConfig: HardhatUserConfig) => nextConfig;

      const extendedConfig = await extendUserConfig(config, next);
      assert.deepEqual(extendedConfig.networks?.localhost, {
        url: "http://localhost:1234",
        type: "http",
      });
    });

    it("should not allow overriding the type of the localhost network", async () => {
      const config = {
        networks: {
          localhost: {
            type: "http2",
          },
        },
      };
      const next = async (nextConfig: HardhatUserConfig) => nextConfig;

      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      -- testing invalid network type for js users */
      const extendedConfig = await extendUserConfig(config as any, next);
      assert.deepEqual(extendedConfig.networks?.localhost, {
        url: "http://localhost:8545",
        type: "http",
      });
    });
  });

  describe("validateUserConfig", () => {
    it("should pass if the config is valid", async () => {
      const config: HardhatUserConfig = {
        defaultChainType: "generic",
        defaultNetwork: "localhost",
        networks: {
          localhost: {
            type: "http",
            chainId: 1337,
            chainType: "l1",
            from: "0x123",
            gas: "auto",
            gasMultiplier: 1.5,
            gasPrice: 100n,
            url: "http://localhost:8545",
            timeout: 10_000,
            httpHeaders: {
              "Content-Type": "application/json",
            },
          },
        },
      };

      const validationErrors = await validateUserConfig(config);

      assert.equal(validationErrors.length, 0);
    });

    it("should throw if the defaultChainType is not a valid chain type", async () => {
      const config = {
        defaultChainType: "invalid",
      };

      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      -- testing invalid network type for js users */
      const validationErrors = await validateUserConfig(config as any);

      assert.ok(
        validationErrors.length > 0,
        "validation errors should be present",
      );
      assert.equal(
        validationErrors[0].message,
        "Expected 'l1', 'optimism', or 'generic'",
      );
    });

    it("should throw if the defaultNetwork is not a string", async () => {
      const config = {
        defaultNetwork: 123,
      };

      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      -- testing invalid network type for js users */
      const validationErrors = await validateUserConfig(config as any);

      assert.ok(
        validationErrors.length > 0,
        "validation errors should be present",
      );
      assert.equal(
        validationErrors[0].message,
        "Expected string, received number",
      );
    });

    it("should throw if the networks object is not a record", async () => {
      const config = {
        networks: 123,
      };

      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      -- testing invalid network type for js users */
      const validationErrors = await validateUserConfig(config as any);

      assert.ok(
        validationErrors.length > 0,
        "validation errors should be present",
      );
      assert.equal(
        validationErrors[0].message,
        "Expected object, received number",
      );
    });

    it("should throw if the network type is not valid", async () => {
      const config = {
        networks: {
          localhost: {
            type: "invalid",
          },
        },
      };

      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      -- testing invalid network type for js users */
      const validationErrors = await validateUserConfig(config as any);

      assert.ok(
        validationErrors.length > 0,
        "validation errors should be present",
      );
      assert.equal(
        validationErrors[0].message,
        "Invalid discriminator value. Expected 'http' | 'edr'",
      );
    });

    it("should throw if the network type is missing", async () => {
      const config = {
        networks: {
          localhost: {},
        },
      };

      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      -- testing invalid network type for js users */
      const validationErrors = await validateUserConfig(config as any);

      assert.ok(
        validationErrors.length > 0,
        "validation errors should be present",
      );
      assert.equal(
        validationErrors[0].message,
        "Invalid discriminator value. Expected 'http' | 'edr'",
      );
    });

    it("should throw if the chainId is invalid", async () => {
      const config = {
        networks: {
          localhost: {
            type: "http",
            url: "http://localhost:8545",
            chainId: "invalid",
          },
        },
      };

      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      -- testing invalid network type for js users */
      const validationErrors = await validateUserConfig(config as any);

      assert.ok(
        validationErrors.length > 0,
        "validation errors should be present",
      );
      assert.equal(
        validationErrors[0].message,
        "Expected number, received string",
      );
    });

    it("should throw if the chainType is invalid", async () => {
      const config = {
        networks: {
          localhost: {
            type: "http",
            url: "http://localhost:8545",
            chainType: "invalid",
          },
        },
      };

      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      -- testing invalid network type for js users */
      const validationErrors = await validateUserConfig(config as any);

      assert.ok(
        validationErrors.length > 0,
        "validation errors should be present",
      );
      assert.equal(
        validationErrors[0].message,
        "Expected 'l1', 'optimism', or 'generic'",
      );
    });

    it("should throw if the from is invalid", async () => {
      const config = {
        networks: {
          localhost: {
            type: "http",
            url: "http://localhost:8545",
            from: 123,
          },
        },
      };

      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      -- testing invalid network type for js users */
      const validationErrors = await validateUserConfig(config as any);

      assert.ok(
        validationErrors.length > 0,
        "validation errors should be present",
      );
      assert.equal(
        validationErrors[0].message,
        "Expected string, received number",
      );
    });

    it("should throw if the gas is invalid", async () => {
      const configWithInvalidGas = {
        networks: {
          localhost: {
            type: "http",
            url: "http://localhost:8545",
            gas: "invalid",
          },
        },
      };

      let validationErrors = await validateUserConfig(
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- testing invalid network type for js users */
        configWithInvalidGas as any,
      );

      assert.ok(
        validationErrors.length > 0,
        "validation errors should be present",
      );
      assert.equal(
        validationErrors[0].message,
        `Invalid literal value, expected "auto"`,
      );

      const configWithNonSafeIntGas = {
        networks: {
          localhost: {
            type: "http",
            url: "http://localhost:8545",
            gas: Number.MAX_SAFE_INTEGER + 1,
          },
        },
      };

      validationErrors = await validateUserConfig(
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- testing invalid network type for js users */
        configWithNonSafeIntGas as any,
      );

      assert.ok(
        validationErrors.length > 0,
        "validation errors should be present",
      );

      assert.equal(
        validationErrors[0].message,
        "Number must be less than or equal to 9007199254740991",
      );

      const configWithNegativeGas = {
        networks: {
          localhost: {
            type: "http",
            url: "http://localhost:8545",
            gas: -100,
          },
        },
      };

      validationErrors = await validateUserConfig(
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- testing invalid network type for js users */
        configWithNegativeGas as any,
      );

      assert.ok(
        validationErrors.length > 0,
        "validation errors should be present",
      );

      assert.equal(
        validationErrors[0].message,
        "Number must be greater than 0",
      );
    });

    it("should throw if the gasMultiplier is invalid", async () => {
      const config = {
        networks: {
          localhost: {
            type: "http",
            url: "http://localhost:8545",
            gasMultiplier: "invalid",
          },
        },
      };

      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      -- testing invalid network type for js users */
      const validationErrors = await validateUserConfig(config as any);

      assert.ok(
        validationErrors.length > 0,
        "validation errors should be present",
      );
      assert.equal(
        validationErrors[0].message,
        "Expected number, received string",
      );
    });

    it("should throw if the gasPrice is invalid", async () => {
      const configWithInvalidGasPrice = {
        networks: {
          localhost: {
            type: "http",
            url: "http://localhost:8545",
            gasPrice: "invalid",
          },
        },
      };

      let validationErrors = await validateUserConfig(
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- testing invalid network type for js users */
        configWithInvalidGasPrice as any,
      );

      assert.ok(
        validationErrors.length > 0,
        "validation errors should be present",
      );
      assert.equal(
        validationErrors[0].message,
        `Invalid literal value, expected "auto"`,
      );

      const configWithNonSafeIntGasPrice = {
        networks: {
          localhost: {
            type: "http",
            url: "http://localhost:8545",
            gasPrice: Number.MAX_SAFE_INTEGER + 1,
          },
        },
      };

      validationErrors = await validateUserConfig(
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- testing invalid network type for js users */
        configWithNonSafeIntGasPrice as any,
      );

      assert.ok(
        validationErrors.length > 0,
        "validation errors should be present",
      );

      assert.equal(
        validationErrors[0].message,
        "Number must be less than or equal to 9007199254740991",
      );

      const configWithNegativeGasPrice = {
        networks: {
          localhost: {
            type: "http",
            url: "http://localhost:8545",
            gasPrice: -100,
          },
        },
      };

      validationErrors = await validateUserConfig(
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- testing invalid network type for js users */
        configWithNegativeGasPrice as any,
      );

      assert.ok(
        validationErrors.length > 0,
        "validation errors should be present",
      );

      assert.equal(
        validationErrors[0].message,
        "Number must be greater than 0",
      );
    });

    describe("http network specific fields", () => {
      it("should throw if the url is missing", async () => {
        const config = {
          networks: {
            localhost: {
              type: "http",
            },
          },
        };

        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- testing invalid network type for js users */
        const validationErrors = await validateUserConfig(config as any);

        assert.ok(
          validationErrors.length > 0,
          "validation errors should be present",
        );
        assert.equal(
          validationErrors[0].message,
          "Expected a URL or a Configuration Variable",
        );
      });

      it("should throw if the url is invalid", async () => {
        const config = {
          networks: {
            localhost: {
              type: "http",
              url: "invalid",
            },
          },
        };

        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- testing invalid network type for js users */
        const validationErrors = await validateUserConfig(config as any);

        assert.ok(
          validationErrors.length > 0,
          "validation errors should be present",
        );
        assert.equal(
          validationErrors[0].message,
          "Expected a URL or a Configuration Variable",
        );
      });

      it("should throw if the timeout is invalid", async () => {
        const config = {
          networks: {
            localhost: {
              type: "http",
              url: "http://localhost:8545",
              timeout: "invalid",
            },
          },
        };

        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- testing invalid network type for js users */
        const validationErrors = await validateUserConfig(config as any);

        assert.ok(
          validationErrors.length > 0,
          "validation errors should be present",
        );
        assert.equal(
          validationErrors[0].message,
          "Expected number, received string",
        );
      });

      it("should throw if the httpHeaders is invalid", async () => {
        const configWithStringHeaders = {
          networks: {
            localhost: {
              type: "http",
              url: "http://localhost:8545",
              httpHeaders: "Content-Type: application/json",
            },
          },
        };

        let validationErrors = await validateUserConfig(
          /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          -- testing invalid network type for js users */
          configWithStringHeaders as any,
        );

        assert.ok(
          validationErrors.length > 0,
          "validation errors should be present",
        );
        assert.equal(
          validationErrors[0].message,
          "Expected object, received string",
        );

        const configWithInvalidHeaderValue = {
          networks: {
            localhost: {
              type: "http",
              url: "http://localhost:8545",
              httpHeaders: {
                "Content-Type": 123,
              },
            },
          },
        };

        validationErrors = await validateUserConfig(
          /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          -- testing invalid network type for js users */
          configWithInvalidHeaderValue as any,
        );

        assert.ok(
          validationErrors.length > 0,
          "validation errors should be present",
        );
        assert.equal(
          validationErrors[0].message,
          "Expected string, received number",
        );
      });
    });

    describe("accounts", () => {
      const ACCOUNTS_ERROR = `Error in the "accounts" property in configuration:`;

      const HD_ACCOUNT_MNEMONIC_MSG = `${ACCOUNTS_ERROR} the "mnemonic" property of the HD account must be a string`;
      const HD_ACCOUNT_INITIAL_INDEX_MSG = `${ACCOUNTS_ERROR} the "initialIndex" property of the HD account must be an integer number`;
      const HD_ACCOUNT_COUNT_MSG = `${ACCOUNTS_ERROR} the "count" property of the HD account must be a positive integer number`;
      const HD_ACCOUNT_PATH_MSG = `${ACCOUNTS_ERROR} the "path" property of the HD account must be a string`;

      describe("http config", async () => {
        let hardhatUserConfig: any; // Use any to allow assigning also wrong values

        const validationErrorMsg = `The "accounts" property in the configuration should be set to one of the following values: "remote", an array of private keys, or an object containing a mnemonic value and optional account details such as initialIndex, count, path, and passphrase`;

        before(() => {
          hardhatUserConfig = {
            networks: {
              localhost: {
                type: "http",
                accounts: "", // Modified in the tests
                url: "http://localhost:8545",
              },
            },
          };
        });

        describe("allowed values", () => {
          it("should allow the value 'remote'", async () => {
            hardhatUserConfig.networks.localhost.accounts = "remote";

            const validationErrors =
              await validateUserConfig(hardhatUserConfig);

            assert.equal(validationErrors.length, 0);
          });

          it("should allow an array of valid private keys", async () => {
            hardhatUserConfig.networks.localhost.accounts = [
              "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
            ];

            const validationErrors =
              await validateUserConfig(hardhatUserConfig);
            assert.equal(validationErrors.length, 0);
          });

          it("should allow an account with a valid HttpNetworkHDAccountsConfig", async () => {
            hardhatUserConfig.networks.localhost.accounts = {
              mnemonic: "asd asd asd",
              initialIndex: 0,
              count: 123,
              path: "m/123",
              passphrase: "passphrase",
            };

            const validationErrors =
              await validateUserConfig(hardhatUserConfig);

            assert.equal(validationErrors.length, 0);
          });

          it("should allow valid private keys with missing hex prefix", async () => {
            hardhatUserConfig.networks.localhost.accounts = [
              "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ];

            const validationErrors =
              await validateUserConfig(hardhatUserConfig);

            assert.equal(validationErrors.length, 0);
          });
        });

        describe("not allowed values", () => {
          describe("wrong private key formats", () => {
            it("should not allow hex literals", async () => {
              hardhatUserConfig.networks.localhost.accounts = [
                0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,
              ];

              const validationErrors =
                await validateUserConfig(hardhatUserConfig);

              assert.notEqual(validationErrors.length, 0);
              assert.equal(
                validationErrors[0].message,
                `${ACCOUNTS_ERROR} the private key must be a string`,
              );
            });

            it("should not allow private keys of incorrect length", async () => {
              hardhatUserConfig.networks.localhost.accounts = ["0xaaaa"];

              let validationErrors =
                await validateUserConfig(hardhatUserConfig);

              assert.notEqual(validationErrors.length, 0);
              assert.equal(
                validationErrors[0].message,
                `${ACCOUNTS_ERROR} the private key must be exactly 32 bytes long`,
              );

              hardhatUserConfig.networks.localhost.accounts = [
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabb",
              ];
              validationErrors = await validateUserConfig(hardhatUserConfig);

              assert.notEqual(validationErrors.length, 0);
              assert.equal(
                validationErrors[0].message,
                `${ACCOUNTS_ERROR} the private key must be exactly 32 bytes long`,
              );
            });

            it("should not allow invalid private keys", async () => {
              hardhatUserConfig.networks.localhost.accounts = [
                "0xgggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg",
              ];

              const validationErrors =
                await validateUserConfig(hardhatUserConfig);

              assert.notEqual(validationErrors.length, 0);
              assert.equal(
                validationErrors[0].message,
                `${ACCOUNTS_ERROR} the private key must contain only valid hexadecimal characters`,
              );
            });
          });
        });

        it("should fail with invalid types", async () => {
          const accountsValuesToTest = [123, [{}], { asd: 123 }];

          for (const accounts of accountsValuesToTest) {
            hardhatUserConfig.networks.localhost.accounts = accounts;

            const validationErrors =
              await validateUserConfig(hardhatUserConfig);

            assert.notEqual(validationErrors.length, 0);
            assert.equal(validationErrors[0].message, validationErrorMsg);
          }
        });

        it("should fail with invalid HttpNetworkHDAccountsConfig", async () => {
          const accountsValuesToTest = [
            [{ mnemonic: 123 }, HD_ACCOUNT_MNEMONIC_MSG],
            [
              { mnemonic: "valid", initialIndex: "asd" },
              HD_ACCOUNT_INITIAL_INDEX_MSG,
            ],
            [
              { mnemonic: "valid", initialIndex: 1, count: "asd" },
              HD_ACCOUNT_COUNT_MSG,
            ],
            [
              { mnemonic: "valid", initialIndex: 1, count: 1, path: 123 },
              HD_ACCOUNT_PATH_MSG,
            ],
            [{ type: 123 }, validationErrorMsg],
            [
              {
                initialIndex: 1,
              },
              HD_ACCOUNT_MNEMONIC_MSG,
            ],
          ];

          for (const [accounts, error] of accountsValuesToTest) {
            hardhatUserConfig.networks.localhost.accounts = accounts;

            const validationErrors =
              await validateUserConfig(hardhatUserConfig);

            assert.notEqual(validationErrors.length, 0);
            assert.equal(validationErrors[0].message, error);
          }
        });
      });

      describe("edr config", async () => {
        let hardhatUserConfig: any; // Use any to allow assigning also wrong values

        const validationErrorMsg = `The "accounts" property in the configuration should be set to one of the following values: an array of objects with 'privateKey' and 'balance', or an object containing optional account details such as mnemonic, initialIndex, count, path, accountsBalance, and passphrase`;

        before(() => {
          hardhatUserConfig = {
            networks: {
              localhost: {
                chainId: 1,
                gas: "auto",
                gasMultiplier: 1,
                gasPrice: "auto",
                type: "edr",
                accounts: "", // Modified in the tests
                url: "http://localhost:8545",
              },
            },
          };
        });

        describe("allowed values", () => {
          it("should allow an array of account objects with valid private keys", async () => {
            hardhatUserConfig.networks.localhost.accounts = [
              {
                balance: "123",
                privateKey:
                  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              },
              {
                balance: "123",
                privateKey:
                  "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              },
              {
                balance: "123",
                privateKey:
                  "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
              },
            ];

            const validationErrors =
              await validateUserConfig(hardhatUserConfig);

            assert.equal(validationErrors.length, 0);
          });

          it("should allow an account with a valid EdrNetworkHDAccountsConfig", async () => {
            hardhatUserConfig.networks.localhost.accounts = {
              mnemonic: "asd asd asd",
              initialIndex: 0,
              count: 123,
              path: "m/1/2",
              accountsBalance: "123",
              passphrase: "passphrase",
            };

            const validationErrors =
              await validateUserConfig(hardhatUserConfig);

            assert.equal(validationErrors.length, 0);
          });

          it("should allow valid private keys with missing hex prefix", async () => {
            hardhatUserConfig.networks.localhost.accounts = [
              {
                balance: "123",
                privateKey:
                  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              },
            ];

            const validationErrors =
              await validateUserConfig(hardhatUserConfig);

            assert.equal(validationErrors.length, 0);
          });
        });

        describe("not allowed values", () => {
          describe("wrong private key formats", () => {
            it("should not allow hex literals", async () => {
              hardhatUserConfig.networks.localhost.accounts = [
                {
                  balance: "123",
                  privateKey: 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,
                },
              ];

              const validationErrors =
                await validateUserConfig(hardhatUserConfig);

              assert.notEqual(validationErrors.length, 0);
              assert.equal(
                validationErrors[0].message,
                `${ACCOUNTS_ERROR} the private key must be a string`,
              );
            });

            it("should not allow private keys of incorrect length", async () => {
              hardhatUserConfig.networks.localhost.accounts = [
                {
                  balance: "123",
                  privateKey: "0xaaaa",
                },
              ];

              let validationErrors =
                await validateUserConfig(hardhatUserConfig);

              assert.notEqual(validationErrors.length, 0);
              assert.equal(
                validationErrors[0].message,
                `${ACCOUNTS_ERROR} the private key must be exactly 32 bytes long`,
              );

              hardhatUserConfig.networks.localhost.accounts = [
                {
                  balance: "123",
                  privateKey:
                    "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbb",
                },
              ];

              validationErrors = await validateUserConfig(hardhatUserConfig);

              assert.notEqual(validationErrors.length, 0);
              assert.equal(
                validationErrors[0].message,
                `${ACCOUNTS_ERROR} the private key must be exactly 32 bytes long`,
              );
            });

            it("should not allow invalid private keys", async () => {
              hardhatUserConfig.networks.localhost.accounts = [
                {
                  balance: "123",
                  privateKey:
                    "0xgggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg",
                },
              ];

              const validationErrors =
                await validateUserConfig(hardhatUserConfig);

              assert.notEqual(validationErrors.length, 0);
              assert.equal(
                validationErrors[0].message,
                `${ACCOUNTS_ERROR} the private key must contain only valid hexadecimal characters`,
              );
            });
          });

          it("should not allow an array that contains a value that is not an object", async () => {
            hardhatUserConfig.networks.localhost.accounts = [
              {
                balance: "123",
                privateKey:
                  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              },
              "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              {
                balance: "123",
                privateKey:
                  "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
              },
            ];

            const validationErrors =
              await validateUserConfig(hardhatUserConfig);

            assert.notEqual(validationErrors.length, 0);
            assert.equal(validationErrors[0].message, validationErrorMsg);
          });

          it("should fail with invalid types", async () => {
            const accountsValuesToTest = [
              123,
              [{}],
              [
                {
                  privateKey:
                    "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                },
              ],
              [{ balance: "" }],
              [{ balance: 213 }],
              [{ privateKey: 123 }],
            ];

            for (const accounts of accountsValuesToTest) {
              hardhatUserConfig.networks.localhost.accounts = accounts;

              const validationErrors =
                await validateUserConfig(hardhatUserConfig);

              assert.notEqual(validationErrors.length, 0);
              assert.equal(validationErrors[0].message, validationErrorMsg);
            }
          });

          it("should fail when the array of objects contains an invalid private key", async () => {
            hardhatUserConfig.networks.localhost.accounts = [
              { privateKey: "0xxxxx", balance: 213 },
            ];

            const validationErrors =
              await validateUserConfig(hardhatUserConfig);

            assert.notEqual(validationErrors.length, 0);
            assert.equal(
              validationErrors[0].message,
              `${ACCOUNTS_ERROR} the private key must be exactly 32 bytes long`,
            );
          });

          it("should fail with invalid HD accounts", async () => {
            const accountsValuesToTest = [
              [{ mnemonic: 123 }, HD_ACCOUNT_MNEMONIC_MSG],
              [
                { mnemonic: "valid", initialIndex: "asd" },
                HD_ACCOUNT_INITIAL_INDEX_MSG,
              ],
              [
                { mnemonic: "valid", initialIndex: 1, count: "asd" },
                HD_ACCOUNT_COUNT_MSG,
              ],
              [
                { mnemonic: "valid", initialIndex: 1, count: 1, path: 123 },
                HD_ACCOUNT_PATH_MSG,
              ],
              [{ type: 123 }, validationErrorMsg],
            ];

            for (const [accounts, error] of accountsValuesToTest) {
              hardhatUserConfig.networks.localhost.accounts = accounts;

              const validationErrors =
                await validateUserConfig(hardhatUserConfig);

              assert.notEqual(validationErrors.length, 0);
              assert.equal(validationErrors[0].message, error);
            }
          });
        });
      });
    });
  });

  describe("resolveUserConfig", () => {
    let hre: HardhatRuntimeEnvironment;

    before(async () => {
      hre = await createHardhatRuntimeEnvironment({});
    });

    it("should resolve an empty user config with the defaults", async () => {
      // This is how the user config looks like after it's been extended
      // by the extendUserConfig hook handler defined in the network-manager plugin.
      const extendedConfig: HardhatUserConfig = {
        networks: {
          localhost: {
            url: "http://localhost:8545",
            type: "http",
          },
        },
      };
      const resolveConfigurationVariable = () =>
        new ResolvedConfigurationVariableImplementation(hre.hooks, {
          name: "foo",
          _type: "ConfigurationVariable",
        });
      const next = async (
        nextUserConfig: HardhatUserConfig,
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- Cast for simplicity as we won't test this */
      ) => nextUserConfig as HardhatConfig;

      const resolvedConfig = await resolveUserConfig(
        extendedConfig,
        resolveConfigurationVariable,
        next,
      );

      assert.equal(resolvedConfig.defaultChainType, "generic");
      assert.equal(resolvedConfig.defaultNetwork, "hardhat");
      assert.deepEqual(resolvedConfig.networks, {
        localhost: {
          type: "http",
          chainId: undefined,
          chainType: undefined,
          from: undefined,
          gas: "auto",
          gasMultiplier: 1,
          gasPrice: "auto",
          accounts: "remote",
          url: "http://localhost:8545",
          timeout: 20_000,
          httpHeaders: {},
        },
      });
    });

    it("should resolve with the user config", async () => {
      const userConfig: HardhatUserConfig = {
        // To change the defaultChainType, we need to augment the Hardhat types.
        // Since this can't be done for a single test, we'll leave this untested.
        defaultChainType: "generic",
        defaultNetwork: "myNetwork",
        networks: {
          myNetwork: {
            type: "http",
            chainId: 1234,
            chainType: "l1",
            from: "0x123",
            gas: "auto",
            gasMultiplier: 1.5,
            gasPrice: 100n,
            accounts: ["0x000006d4548a3ac17d72b372ae1e416bf65b8ead"],
            url: "http://node.myNetwork.com",
            timeout: 10_000,
            httpHeaders: {
              "Content-Type": "application/json",
            },
          },
        },
      };
      const resolveConfigurationVariable = () =>
        new ResolvedConfigurationVariableImplementation(hre.hooks, {
          name: "foo",
          _type: "ConfigurationVariable",
        });
      const next = async (
        nextUserConfig: HardhatUserConfig,
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- Cast for simplicity as we won't test this */
      ) => nextUserConfig as HardhatConfig;

      const resolvedConfig = await resolveUserConfig(
        userConfig,
        resolveConfigurationVariable,
        next,
      );

      assert.equal(resolvedConfig.defaultChainType, "generic");
      assert.equal(resolvedConfig.defaultNetwork, "myNetwork");
      assert.deepEqual(resolvedConfig.networks, {
        myNetwork: {
          type: "http",
          chainId: 1234,
          chainType: "l1",
          from: "0x123",
          gas: "auto",
          gasMultiplier: 1.5,
          gasPrice: 100n,
          accounts: ["0x000006d4548a3ac17d72b372ae1e416bf65b8ead"],
          url: "http://node.myNetwork.com",
          timeout: 10_000,
          httpHeaders: {
            "Content-Type": "application/json",
          },
        },
      });
    });

    describe("accounts", () => {
      it("should normalize the accounts' private keys", async () => {
        const userConfig: HardhatUserConfig = {
          networks: {
            myNetwork: {
              type: "http",
              chainId: 1234,
              chainType: "l1",
              from: "0x123",
              gas: "auto",
              gasMultiplier: 1.5,
              gasPrice: 100n,
              accounts: [
                "0x000006d4548a3ac17d72b372ae1e416bf65b8AAA", // convert to lower case
                " 0x000006d4548a3ac17d72b372ae1e416bf65b8bbb", // remove space at the beginning
                "0x000006d4548a3ac17d72b372ae1e416bf65b8ccc  ", // remove space at the end
                "000006d4548a3ac17d72b372ae1e416bf65b8ddd", // add "0x" at the beginning
              ],
              url: "http://node.myNetwork.com",
              timeout: 10_000,
              httpHeaders: {
                "Content-Type": "application/json",
              },
            },
          },
        };
        const resolveConfigurationVariable = () =>
          new ResolvedConfigurationVariableImplementation(hre.hooks, {
            name: "foo",
            _type: "ConfigurationVariable",
          });
        const next = async (
          nextUserConfig: HardhatUserConfig,
          /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          -- Cast for simplicity as we won't test this */
        ) => nextUserConfig as HardhatConfig;

        const resolvedConfig = await resolveUserConfig(
          userConfig,
          resolveConfigurationVariable,
          next,
        );

        assert.deepEqual(resolvedConfig.networks, {
          myNetwork: {
            type: "http",
            chainId: 1234,
            chainType: "l1",
            from: "0x123",
            gas: "auto",
            gasMultiplier: 1.5,
            gasPrice: 100n,
            accounts: [
              "0x000006d4548a3ac17d72b372ae1e416bf65b8aaa",
              "0x000006d4548a3ac17d72b372ae1e416bf65b8bbb",
              "0x000006d4548a3ac17d72b372ae1e416bf65b8ccc",
              "0x000006d4548a3ac17d72b372ae1e416bf65b8ddd",
            ],
            url: "http://node.myNetwork.com",
            timeout: 10_000,
            httpHeaders: {
              "Content-Type": "application/json",
            },
          },
        });
      });

      it("should accept a valid partial HD account config", async () => {
        const userConfig: HardhatUserConfig = {
          networks: {
            myNetwork: {
              type: "http",
              chainId: 1234,
              chainType: "l1",
              from: "0x123",
              gas: "auto",
              gasMultiplier: 1.5,
              gasPrice: 100n,
              accounts: {
                mnemonic: "asd asd asd",
                passphrase: "passphrase",
              },
              url: "http://node.myNetwork.com",
              timeout: 10_000,
              httpHeaders: {
                "Content-Type": "application/json",
              },
            },
          },
        };
        const resolveConfigurationVariable = () =>
          new ResolvedConfigurationVariableImplementation(hre.hooks, {
            name: "foo",
            _type: "ConfigurationVariable",
          });
        const next = async (
          nextUserConfig: HardhatUserConfig,
          /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          -- Cast for simplicity as we won't test this */
        ) => nextUserConfig as HardhatConfig;

        const resolvedConfig = await resolveUserConfig(
          userConfig,
          resolveConfigurationVariable,
          next,
        );

        assert.deepEqual(resolvedConfig.networks, {
          myNetwork: {
            type: "http",
            chainId: 1234,
            chainType: "l1",
            from: "0x123",
            gas: "auto",
            gasMultiplier: 1.5,
            gasPrice: 100n,
            accounts: {
              mnemonic: "asd asd asd",
              initialIndex: 0,
              count: 20,
              path: "m/44'/60'/0'/0",
              passphrase: "passphrase",
            },
            url: "http://node.myNetwork.com",
            timeout: 10_000,
            httpHeaders: {
              "Content-Type": "application/json",
            },
          },
        });
      });
    });
  });
});