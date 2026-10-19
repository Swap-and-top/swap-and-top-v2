/** Loading: Edit or Finish an item, the stock form in bones. */

import { StockFormSkeleton } from '../../StockFormSkeleton';

export default function Loading() {
  return (
    <StockFormSkeleton
      title="Edit item"
      meta="Changes show on the listing once saved."
      editing
    />
  );
}
