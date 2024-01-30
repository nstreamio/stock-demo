import { ValueDownlink, WarpClient, WarpRef } from "@swim/client";
import { Value } from "@swim/structure";
import { useEffect, useRef } from "react";

export interface UseValueDownlinkProps<T> {
  hostUri: string;
  nodeUri: string;
  laneUri: string;
  didSet: (newValue: Value, oldValue: Value) => T;
}

export const useValueDownlink: <T extends any | undefined>(
  args: UseValueDownlinkProps<T>
) => ValueDownlink<WarpRef, Value, [Value]> | null = (args) => {
  const { hostUri, nodeUri, laneUri, didSet } = args;

  const downlinkRef = useRef<ValueDownlink<WarpRef, Value, [Value]> | null>(null);
  const didSetRef = useRef<UseValueDownlinkProps<any>["didSet"]>();
  didSetRef.current = didSet;

  useEffect(() => {
    if (downlinkRef.current) {
      return;
    }

    // .global() exposes singleton reference
    const client: WarpClient = WarpClient.global();
    client.hostUri.setValue("warp://localhost:9001");

    // Downlink creation uses the builder pattern so we call .open() in the expression to make sure we
    // get a reference to the downlink itself instead of the builder object.
    downlinkRef.current = client
      .downlinkValue({
        nodeUri,
        laneUri,
        didSet: (newValue, oldValue) => {
          didSetRef.current?.(newValue, oldValue);
        },
      })
      .open();
  }, [hostUri, nodeUri, laneUri]);

  return downlinkRef.current;
};
