import React, { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import "./styles.css";

type ToastPayload = {
  type: "success" | "error" | "warning" | "info";
  message: string;
  dismissTime?: number;
};

type ExtendedToastPayload = ToastPayload & { date: number };

const toastColorMap = {
  success: "green",
  error: "red",
  warning: "orange",
  info: "lightblue"
} as const;

type ToastProviderProps = {
  children?: React.ReactNode;
  dismissTime?: number;
  renderToast: (props: ExtendedToastPayload) => JSX.Element;
};

type ToastContextValue = {
  dispatchToast: (payload: ToastPayload) => void;
};

type ToastProps = ToastPayload;

function useIsMounted() {
  const mountRef = useRef(false);
  useLayoutEffect(() => {
    mountRef.current = true;
    return () => {
      mountRef.current = false;
    };
  }, []);

  return mountRef;
}

function useSafeDispatch<TDispatcher>(dispather: TDispatcher) {
  const isMounted = useIsMounted();
  return (useCallback(
    (...args) => {
      if (!isMounted.current) return;
      if (typeof dispather === "function") dispather(...args);
    },
    [dispather, isMounted]
  ) as unknown) as TDispatcher;
}

const ToastContext = React.createContext<ToastContextValue>(
  {} as ToastContextValue
);

function Toast({ type, message }: ToastProps) {
  return (
    <div style={{ border: `1px solid ${toastColorMap[type]}`, padding: 16 }}>
      {type}: {message}
    </div>
  );
}

function ToastProvider({
  children,
  dismissTime = 2000,
  renderToast
}: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ExtendedToastPayload[]>([]);
  const safeSetToasts = useSafeDispatch(setToasts);

  const dispatchToast = useCallback(
    (payload: ToastPayload) => {
      const realDismissTime: number = payload.dismissTime ?? dismissTime;

      const extendPayload = { ...payload, date: new Date().valueOf() };

      safeSetToasts((oldToasts) => [extendPayload, ...oldToasts]);

      setTimeout(() => {
        safeSetToasts((oldToasts) =>
          oldToasts.filter((toastPayload) => toastPayload !== extendPayload)
        );
      }, realDismissTime);
    },
    [dismissTime, safeSetToasts]
  );

  const value = useMemo(
    () => ({
      dispatchToast
    }),
    [dispatchToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ul
        style={{
          listStyle: "none",
          position: "absolute",
          bottom: 0,
          right: 0,
          padding: 24
        }}
      >
        {toasts.map((toastPayload) => (
          <li key={toastPayload.date} style={{ margin: 8 }}>
            {renderToast(toastPayload)}
          </li>
        ))}
      </ul>
    </ToastContext.Provider>
  );
}

function useToasts() {
  return React.useContext(ToastContext);
}

function TestToastDispatch({ type, message }: ToastPayload) {
  const { dispatchToast } = useToasts();

  return (
    <button onClick={() => dispatchToast({ type, message })}>{type}</button>
  );
}

export default function App() {
  return (
    <div className="App">
      <h1>use-toasts</h1>
      <h2>Dispatch a toast and see what happens!</h2>
      <ToastProvider
        renderToast={({ type, message }) => (
          <Toast type={type} message={message} />
        )}
      >
        <TestToastDispatch message="YAY! Stay toasty! 🍞" type="success" />
        <TestToastDispatch message="Stay toasty! 🍞" type="info" />
        <TestToastDispatch
          message="Watch out: Stay toasty! 🍞"
          type="warning"
        />
        <TestToastDispatch message="Oh, no! Stay toasty! 🍞" type="error" />
      </ToastProvider>
    </div>
  );
}
