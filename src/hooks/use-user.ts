import supabase from "@/services/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store";
import type { Store } from "@/store";
import { hasGuestRules } from "@/services/rules/local";
import { migrateGuestRulesToAccount } from "@/services/rules/rules";
import { hasGuestRecordings } from "@/services/recordings/local";
import { migrateGuestRecordingsToAccount } from "@/services/recordings/recordings";
import { notify } from "@/utils/notification";

export const useUser = () => {
  const { setSession } = useStore() as Store;

  const { data, isLoading } = useQuery({
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        return { user: null, meta: null };
      }

      setSession(sessionData.session);

      if (hasGuestRules()) {
        try {
          await migrateGuestRulesToAccount();
          notify('Your local rules were synced to your account', true);
        } catch (e) {
          console.error('Failed to sync local rules to account', e);
          notify('Could not sync your local rules to your account, will retry automatically', false);
        }
      }

      if (hasGuestRecordings()) {
        try {
          await migrateGuestRecordingsToAccount();
          notify('Your local recordings were synced to your account', true);
        } catch (e) {
          console.error('Failed to sync local recordings to account', e);
          notify('Could not sync your local recordings to your account, will retry automatically', false);
        }
      }

      return {
        session: sessionData.session,
        user: sessionData.session.user
      };
    },
    queryKey: ['user'],
    retry: false,
  });

  return { user: data?.user, meta: data?.meta , isLoading };
};
