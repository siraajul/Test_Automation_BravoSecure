#!/usr/bin/env bash
# Connect to the wireless Pixel 7a over ADB before running tests.
# Override the target with: ANDROID_DEVICE=ip:port ./scripts/connect-device.sh
set -euo pipefail

DEVICE="${ANDROID_DEVICE:-192.168.10.192:33789}"

echo "Connecting to ${DEVICE} ..."
adb connect "${DEVICE}" >/dev/null

if adb devices | grep -q "${DEVICE}.*device"; then
  echo "✓ Connected: ${DEVICE}"
  adb -s "${DEVICE}" shell getprop ro.product.model
else
  echo "✗ Could not connect to ${DEVICE}."
  echo "  Make sure wireless debugging is on and discover the port with:"
  echo "    adb mdns services"
  exit 1
fi
