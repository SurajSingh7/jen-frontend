"use client";

import { useEffect, useState } from "react";

// Runs an async loader when `key` changes. Results from an older key are ignored.
export function useLoad(loader, key) {
  const [state, setState] = useState({ data: null, error: "", loading: true });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let stale = false;
    Promise.resolve()
      .then(loader)
      .then((data) => !stale && setState({ data, error: "", loading: false }))
      .catch((err) => !stale && setState((s) => ({ ...s, error: err.message, loading: false })));
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` describes everything the loader depends on
  }, [key, tick]);

  return { ...state, reload: () => setTick((t) => t + 1), setData: (data) => setState((s) => ({ ...s, data })) };
}
