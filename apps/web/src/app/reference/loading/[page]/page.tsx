/**
 * Component reference — a page's loading screen, held on screen.
 *
 * With the mock data the real loading screens flash by too fast to check, so
 * this shows one of them for as long as you look, to compare with its page:
 * /reference/loading/stock, then /console/stock.
 */

import { notFound } from 'next/navigation';
import FeedLoading from '../../../(browse)/loading';
import SearchLoading from '../../../search/loading';
import WantedLoading from '../../../wanted/loading';
import ShopLoading from '../../../shop/[slug]/loading';
import SavedLoading from '../../../saved/loading';
import MeLoading from '../../../me/loading';
import MyListingsLoading from '../../../me/listings/loading';
import OffersLoading from '../../../me/offers/loading';
import DealsLoading from '../../../me/deals/loading';
import DealLoading from '../../../deals/[id]/confirm/loading';
import StockLoading from '../../../console/stock/loading';
import EditStockLoading from '../../../console/stock/edit/[id]/loading';
import LeadsLoading from '../../../console/leads/loading';
import SwapOffersLoading from '../../../console/trade-ins/loading';
import StatsLoading from '../../../console/stats/loading';
import ConsoleShopLoading from '../../../console/shop/loading';
import {
  RequestListingSkeleton,
  SaleListingSkeleton,
  SwapListingSkeleton,
} from '@/components/listing/ListingSkeletons';

const SCREENS = {
  feed: FeedLoading,
  search: SearchLoading,
  wanted: WantedLoading,
  'listing-sale': SaleListingSkeleton,
  'listing-swap': SwapListingSkeleton,
  'listing-wanted': RequestListingSkeleton,
  shop: ShopLoading,
  saved: SavedLoading,
  me: MeLoading,
  'me-listings': MyListingsLoading,
  'me-offers': OffersLoading,
  'me-deals': DealsLoading,
  deal: DealLoading,
  stock: StockLoading,
  'stock-edit': EditStockLoading,
  leads: LeadsLoading,
  'swap-offers': SwapOffersLoading,
  stats: StatsLoading,
  'console-shop': ConsoleShopLoading,
} as const;

export default async function LoadingReferencePage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const Screen = SCREENS[page as keyof typeof SCREENS];
  if (!Screen) notFound();
  return <Screen />;
}
