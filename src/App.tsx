import React from "react";
import "./styles.css";

type ToastPayload = {
  type: "success" | "error" | "warning" | "info";
  message: string;
  dismissTime?: number;
};

type ExtendedToastPayload = ToastPayload & { id: number };

const toastDataMap = {
  success: { light: "#CBF8B3", dark: "#0B5B1D", icon: "✅" },
  error: { light: "#FFC7AD", dark: "#7A0925", icon: "❌" },
  warning: { light: "#FFF1A6", dark: "#7A5606", icon: "⚠️" },
  info: { light: "#B4ECFE", dark: "#0D3378", icon: "ℹ️" }
} as const;

type ToastProviderProps = {
  children?: React.ReactNode;
  dismissTime?: number;
  renderToast: (props: ExtendedToastPayload) => JSX.Element;
};

type ToastContextValue = {
  dispatchToast: (payload: ToastPayload) => void;
  dismissToast: (id: number) => void;
};

type ToastProps = ExtendedToastPayload;

function useIsMounted() {
  const mountRef = React.useRef(false);
  React.useLayoutEffect(() => {
    mountRef.current = true;
    return () => {
      mountRef.current = false;
    };
  }, []);

  return mountRef;
}

function useSafeDispatch<TDispatcher>(dispather: TDispatcher) {
  const isMounted = useIsMounted();
  return (React.useCallback(
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

function ToastProvider({
  children,
  dismissTime = 2000,
  renderToast
}: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ExtendedToastPayload[]>([]);
  const safeSetToasts = useSafeDispatch(setToasts);

  const dispatchToast = React.useCallback(
    (payload: ToastPayload) => {
      const realDismissTime: number = payload.dismissTime ?? dismissTime;

      const extendPayload = { ...payload, id: new Date().valueOf() };

      safeSetToasts((oldToasts) => [extendPayload, ...oldToasts]);

      setTimeout(() => {
        safeSetToasts((oldToasts) =>
          oldToasts.filter((toastPayload) => toastPayload !== extendPayload)
        );
      }, realDismissTime);
    },
    [dismissTime, safeSetToasts]
  );

  const dismissToast = React.useCallback((id: number) => {
    setToasts((oldToasts) => oldToasts.filter((toast) => toast.id !== id));
  }, []);

  const value = React.useMemo(
    () => ({
      dispatchToast,
      dismissToast
    }),
    [dispatchToast, dismissToast]
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
          <li key={toastPayload.id} style={{ margin: 8 }}>
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

function Toast({ type, message, id }: ToastProps) {
  const { dismissToast } = useToasts();

  return (
    <div
      className="fade-in"
      style={{
        border: `1px solid ${toastDataMap[type].dark}`,
        background: toastDataMap[type].light,
        color: toastDataMap[type].dark,
        padding: 16
      }}
    >
      {toastDataMap[type].icon} {message}{" "}
      <button
        aria-label="dismiss-toast"
        style={{
          background: "none",
          border: "none",
          fontSize: 20,
          color: toastDataMap[type].dark
        }}
        onClick={() => dismissToast(id)}
      >
        ⓧ
      </button>
    </div>
  );
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
        renderToast={({ type, message, id }) => (
          <Toast id={id} type={type} message={message} />
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
