import { useEffect, useState } from "react";

/* ----------------------------------------
   Apple-specific DeviceOrientation extension
----------------------------------------- */
interface IOSDeviceOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading: number;
}

/* ----------------------------------------
   Type guards
----------------------------------------- */
function isIOSCompassEvent(
  event: DeviceOrientationEvent
): event is IOSDeviceOrientationEvent {
  return (
    typeof (event as IOSDeviceOrientationEvent).webkitCompassHeading ===
    "number"
  );
}

/* ----------------------------------------
   iOS permission helpers (typed)
----------------------------------------- */
type DeviceOrientationPermissionRequester = {
  requestPermission: () => Promise<PermissionState>;
};

function hasIOSPermissionAPI(): boolean {
  return (
    typeof DeviceOrientationEvent !== "undefined" &&
    "requestPermission" in
      (DeviceOrientationEvent as unknown as DeviceOrientationPermissionRequester)
  );
}

function requestIOSPermission(): Promise<boolean> {
  const requester =
    DeviceOrientationEvent as unknown as DeviceOrientationPermissionRequester;

  return requester
    .requestPermission()
    .then((state: PermissionState) => state === "granted");
}

/* ----------------------------------------
   Main hook
----------------------------------------- */
export function useDeviceHeading(): number | null {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    function handleOrientation(event: DeviceOrientationEvent): void {
      // iOS Safari
      if (isIOSCompassEvent(event)) {
        setHeading(event.webkitCompassHeading);
        return;
      }

      // Standard browsers
      if (event.alpha !== null) {
        setHeading((360 - event.alpha) % 360);
      }
    }

    if (hasIOSPermissionAPI()) {
      requestIOSPermission()
        .then((granted: boolean) => {
          if (granted) {
            window.addEventListener("deviceorientation", handleOrientation);
          }
        })
        .catch((err: unknown) => {
          console.error(err);
        });
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  return heading;
}
