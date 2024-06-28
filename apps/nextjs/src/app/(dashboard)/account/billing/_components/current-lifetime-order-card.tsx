import { getProductPlanPairByVariantId } from "@init/api/billing/billing-util";
import { CircleCheckIcon } from "lucide-react";

import type { BillingConfig } from "@init/api/billing/billing-schema";
import type { Database } from "@init/db/database.types";
import { CurrentPlanBadge } from "./current-plan-badge";
import { LineItemDetails } from "./line-item-details";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type LineItem = Database["public"]["Tables"]["order_items"]["Row"];

type Props = {
  order: Order & {
    items: LineItem[];
  };

  config: BillingConfig;
};

export const CurrentLifetimeOrderCard = ({
  order,
  config,
}: React.PropsWithChildren<Props>) => {
  const lineItems = order.items;
  const firstLineItem = lineItems[0];

  if (!firstLineItem) {
    throw new Error("No line items found in subscription");
  }

  const { product, plan } = getProductPlanPairByVariantId(
    config,
    firstLineItem.variant_id,
  );

  if (!product || !plan) {
    throw new Error(
      "Product or plan not found. Did you forget to add it to the billing config?",
    );
  }

  const productLineItems = plan.lineItems;

  return (
    <div>
      <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 py-8 md:grid-cols-3">
        <div>
          <h2 className="text-base font-light leading-7 text-primary">
            Your Plan
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Below are the details of your current plan. You can change your plan
            or cancel your subscription at any time.
          </p>
        </div>
        <div className="md:col-span-2">
          <div className="space-y-4 text-sm">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2 text-lg font-semibold">
                <CircleCheckIcon className="s-6 fill-green-500 text-black dark:fill-white dark:text-white" />

                <span>{product.name}</span>

                <CurrentPlanBadge status={order.status} />
              </div>
            </div>

            <div>
              <div className="flex flex-col space-y-0.5">
                <span className="font-semibold">Details</span>

                <LineItemDetails
                  lineItems={productLineItems}
                  currency={order.currency}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
