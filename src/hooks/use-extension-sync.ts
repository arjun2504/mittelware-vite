import { pingExtension, syncRulesWithExtension } from "@/services/rules/rules";
import { useStore, type Store } from "@/store";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

const useExtensionSync = () => {
  const { session } = useStore() as Store;
  const isInitialized = useRef(false);
  const location = useLocation();

  const onExtensionPong = (event: MessageEvent) => {
    if (event.data.source !== 'mittelware-intercept-rules-extension') return;

    const { session, setSettings, setIsExtensionConnected } = useStore.getState() as Store;

    if (event.data.type === 'mittelware:intercept:pong') {
      setSettings(event.data.storage.settings);
      setIsExtensionConnected(true);

      if (!isInitialized.current && session.user) {
        syncRulesWithExtension();
        isInitialized.current = true;
      }
    }
  };

   useEffect(() => {
    pingExtension();
  }, [location]);

  useEffect(() => {
    if (session.user) {
      pingExtension();
    }
  }, [session])

  useEffect(() => {
    window.addEventListener('message', onExtensionPong);

    return () => {
      window.removeEventListener('message', onExtensionPong);
    }
  }, []);
};

export default useExtensionSync;
