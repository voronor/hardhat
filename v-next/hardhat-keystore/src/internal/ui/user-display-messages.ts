import chalk from "chalk";

export class UserDisplayMessages {
  public static displayInvalidKeyErrorMessage(key: string): string {
    return chalk.red(
      `Invalid value for key: "${key}". Keys can only have alphanumeric characters and underscores, and they cannot start with a number.`,
    );
  }

  public static displayKeyAlreadyExistsWarning(key: string): string {
    return chalk.yellow(
      `The key "${key}" already exists. Use the ${chalk.blue.italic("--force")} flag to overwrite it.`,
    );
  }

  public static displayKeyListInfoMessage(keys: string[]): string {
    let output = "Keys:";

    for (const key of keys) {
      output += `\n${key}`;
    }

    return output + "\n";
  }

  public static displayKeyNotFoundErrorMessage(key: string): string {
    return chalk.red(`Key "${key}" not found`);
  }

  public static displayKeyRemovedInfoMessage(key: string): string {
    return `Key "${key}" deleted`;
  }

  public static displayKeySetInfoMessage(key: string): string {
    return `Key "${key}" set`;
  }

  public static displayNoKeysInfoMessage(): string {
    return "The keystore does not contain any keys.";
  }

  public static displayNoKeystoreSetErrorMessage(): string {
    return `No keystore found. Please set one up using ${chalk.blue.italic("npx hardhat keystore set {key}")} `;
  }

  public static displaySecretCannotBeEmptyErrorMessage(): string {
    return chalk.red("The value cannot be empty.");
  }

  public static displayValueInfoMessage(value: string): string {
    return `${value}`;
  }

  public static enterSecretMessage(): string {
    return "Enter secret to store: ";
  }
}