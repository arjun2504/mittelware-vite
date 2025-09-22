import { pingExtension, syncRulesWithExtension } from "@/services/rules/rules";
import { useEffect, useState } from "react";

const useExtensionSync = () => {
  const [isExtensionConnected, setIsExtensionConnected] = useState(false);

  const onExtensionPong = (event: MessageEvent) => {
    if (event.data.source === 'mittelware-interceptor-rules-extension' && event.data.type === 'mittelware:intercept:pong') {
      syncRulesWithExtension();
      setIsExtensionConnected(true);
    }
  };

  useEffect(() => {
    window.addEventListener('message', onExtensionPong);
    pingExtension();

    return () => {
      window.removeEventListener('message', onExtensionPong);
    }
  }, []);

  return isExtensionConnected;
};

export default useExtensionSync;
