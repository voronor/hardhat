import {
  bytesToHexString,
  hexStringToBytes,
  hexStringToBigInt,
  numberToHexString,
} from "./hex.js";

/**
 * Converts a Uint8Array to a bigint.
 *
 * @param bytes The Uint8Array to convert.
 * @returns The converted bigint.
 */
export function bytesToBigInt(bytes: Uint8Array): number | bigint {
  return hexStringToBigInt(bytesToHexString(bytes));
}

/**
 * Converts a non-negative safe integer or bigint to a Uint8Array.
 *
 * @param value The number or bigint to convert.
 * @returns The converted Uint8Array.
 * @throws InvalidParameterError If the input is not a safe integer or is negative.
 */
export function numberToBytes(value: number | bigint): Uint8Array {
  return hexStringToBytes(numberToHexString(value));
}