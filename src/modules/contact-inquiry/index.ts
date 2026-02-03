import { Module } from "@medusajs/framework/utils";
import ContactInquiryModuleService from "./service";

export const CONTACT_INQUIRY_MODULE = "contactInquiryModuleService";

export default Module(CONTACT_INQUIRY_MODULE, {
  service: ContactInquiryModuleService,
});

export * from "./types";
