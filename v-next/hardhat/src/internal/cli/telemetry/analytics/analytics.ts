import type {
  EventNames,
  Payload,
  TaskParams,
  TelemetryConsentPayload,
} from "./types.js";

import os from "node:os";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { spawnDetachedSubProcess } from "@ignored/hardhat-vnext-utils/subprocess";

import { getHardhatVersion } from "../../../utils/package.js";
import { getTelemetryConsent } from "../telemetry-consent.js";

import { getClientId, getUserType } from "./utils.js";

// TODO:log const log = debug("hardhat:core:global-dir");

const SESSION_ID = Math.random().toString(); // The same for the whole Hardhat execution

export async function sendTelemetryConsentAnalytics(
  userConsent: boolean,
): Promise<void> {
  // This is a special scenario where only the consent is sent, all the other telemetry info
  // (like node version, hardhat version, etc.) are stripped.
  const payload: TelemetryConsentPayload = {
    client_id: "hardhat_telemetry_consent",
    user_id: "hardhat_telemetry_consent",
    user_properties: {},
    events: [
      {
        name: "TelemetryConsentResponse",
        params: {
          userConsent: userConsent ? "yes" : "no",
        },
      },
    ],
  };

  await createSubprocessToSendAnalytics(payload);
}

export async function sendTaskAnalytics(
  taskName: string,
  scopeName: string | undefined,
): Promise<boolean> {
  const eventParams: TaskParams = {
    task: taskName,
    scope: scopeName,
  };

  return sendAnalytics("task", eventParams);
}

// Return a boolean for test purposes, so we can check if the analytics was sent based on the consent value
async function sendAnalytics(
  eventName: EventNames,
  eventParams: TaskParams,
): Promise<boolean> {
  if ((await getTelemetryConsent()) === false) {
    return false;
  }

  const payload = await buildPayload(eventName, eventParams);

  await createSubprocessToSendAnalytics(payload);

  return true;
}

async function createSubprocessToSendAnalytics(
  payload: TelemetryConsentPayload | Payload,
): Promise<void> {
  // The file extension is 'js' because the 'ts' file will be compiled
  const analyticsSubprocessFilePath = `${dirname(fileURLToPath(import.meta.url))}/analytics-subprocess.js`;

  await spawnDetachedSubProcess(analyticsSubprocessFilePath, [
    JSON.stringify(payload),
  ]);
}

async function buildPayload(
  eventName: EventNames,
  eventParams: TaskParams,
): Promise<Payload> {
  const clientId = await getClientId();

  return {
    client_id: clientId,
    user_id: clientId,
    user_properties: {
      projectId: { value: "hardhat-project" },
      userType: { value: getUserType() },
      hardhatVersion: { value: await getHardhatVersion() },
      operatingSystem: { value: os.platform() },
      nodeVersion: { value: process.version },
    },
    events: [
      {
        name: eventName,
        params: {
          // From the GA docs: amount of time someone spends with your web
          // page in focus or app screen in the foreground
          // The parameter has no use for our app, but it's required in order
          // for user activity to display in standard reports like Realtime
          engagement_time_msec: "10000",
          session_id: SESSION_ID,
          ...eventParams,
        },
      },
    ],
  };
}