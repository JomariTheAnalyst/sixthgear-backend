import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import ResendNotificationProviderService from "./service";

/**
 * Resend Notification Module Provider
 *
 * Registers the Resend service as a notification provider
 * for the Medusa Notification Module.
 */
export default ModuleProvider(Modules.NOTIFICATION, {
  services: [ResendNotificationProviderService],
});
