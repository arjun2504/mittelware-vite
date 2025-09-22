import { Notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";

const Notification = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return (
    <Notifications
      position="bottom-right"
      zIndex={1000}
    />
  );
}

export default Notification;
