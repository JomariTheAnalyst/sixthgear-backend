import { MedusaService } from "@medusajs/framework/utils";
import { MarketingItem } from "./models";

class MarketingModuleService extends MedusaService({
  MarketingItem,
}) {}

export default MarketingModuleService;
