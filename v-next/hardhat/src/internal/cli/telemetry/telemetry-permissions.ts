import path from "node:path";

import { isCi } from "@ignored/hardhat-vnext-utils/ci";
import {
  exists,
  readJsonFile,
  writeJsonFile,
} from "@ignored/hardhat-vnext-utils/fs";
import debug from "debug";

import { getConfigDir } from "../../global-dir.js";
import { confirmationPromptWithTimeout } from "../prompt/prompt.js";

import { sendTelemetryConsentAnalytics } from "./analytics/analytics.js";

const log = debug("hardhat:cli:telemetry:telemetry-permissions");

interface TelemetryConsent {
  consent: boolean;
}

/**
 * Ensure that the user's telemetry consent is set. If the consent is already provided, returns the answer.
 * If not, prompts the user to provide it.
 * Consent is only asked in interactive environments.
 *
 * @returns True if the user consents to telemetry and if current environment supports telemetry, false otherwise.
 */
export async function ensureTelemetryConsent(): Promise<boolean> {
  log("Ensuring that user has provided telemetry consent");

  if (!isTelemetryAllowedInEnvironment()) {
    return false;
  }

  const consent = await getTelemetryConsent();
  if (consent !== undefined) {
    return consent;
  }

  // Telemetry consent not provided yet, ask for it
  return requestTelemetryConsent();
}

/**
 * Checks whether telemetry is supported in the current environment and whether the user has provided consent.
 *
 * @returns True if the user consents to telemetry and if current environment supports telemetry, false otherwise.
 */
export async function isTelemetryAllowed(): Promise<boolean> {
  if (!isTelemetryAllowedInEnvironment()) {
    return false;
  }

  // ATTENTION: only for testing
  if (process.env.HARDHAT_TEST_TELEMETRY_CONSENT_VALUE !== undefined) {
    return process.env.HARDHAT_TEST_TELEMETRY_CONSENT_VALUE === "true"
      ? true
      : false;
  }

  const consent = await getTelemetryConsent();
  log(`Telemetry consent value: ${consent}`);

  return consent !== undefined ? consent : false;
}

/**
 * Determines if telemetry is allowed in the current environment.
 * This function checks various environmental factors to decide if telemetry data can be collected.
 * It verifies that the environment is not a CI environment, that the terminal is interactive,
 * and that telemetry has not been explicitly disabled through an environment variable.
 *
 * @returns True if telemetry is allowed in the environment, false otherwise.
 */
export function isTelemetryAllowedInEnvironment(): boolean {
  const allowed =
    (!isCi() &&
      process.stdout.isTTY === true &&
      process.env.HARDHAT_DISABLE_TELEMETRY_PROMPT !== "true") ||
    // ATTENTION: used in tests to force telemetry execution
    process.env.HARDHAT_TEST_INTERACTIVE_ENV === "true";

  log(`Telemetry is allowed in the current environment: ${allowed}`);

  return allowed;
}

/**
 * Retrieves the user's telemetry consent status from the consent file.
 *
 * @returns True if the user consents to telemetry, false if they do not consent,
 * and undefined if no consent has been provided.
 */
async function getTelemetryConsent(): Promise<boolean | undefined> {
  const telemetryConsentFilePath = await getTelemetryConsentFilePath();

  if (await exists(telemetryConsentFilePath)) {
    // Telemetry consent was already provided, hence return the answer
    return (await readJsonFile<TelemetryConsent>(telemetryConsentFilePath))
      .consent;
  }

  return undefined;
}

async function getTelemetryConsentFilePath() {
  const configDir = await getConfigDir();
  return path.join(configDir, "telemetry-consent.json");
}

async function requestTelemetryConsent(): Promise<boolean> {
  const consent = await confirmTelemetryConsent();

  if (consent === undefined) {
    return false;
  }

  // Store user's consent choice
  log(`Storing telemetry consent with value: ${consent}`);
  await writeJsonFile(await getTelemetryConsentFilePath(), { consent });

  await sendTelemetryConsentAnalytics(consent);

  return consent;
}

async function confirmTelemetryConsent(): Promise<boolean | undefined> {
  log("Prompting user for telemetry consent");

  return confirmationPromptWithTimeout(
    "telemetryConsent",
    "Help us improve Hardhat with anonymous crash reports & basic usage data?",
  );
}