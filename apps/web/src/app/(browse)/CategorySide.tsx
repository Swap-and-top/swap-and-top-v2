'use client';

/**
 * The feed's categories as a side menu from 768px up (SideMenu): each with
 * its icon. On a phone the categories are the row of pills under the
 * search bar instead, which have no icons, and this is not shown.
 */

import { CATEGORY_LABELS, type Category } from '@snt/core';
import { CategoryIcon, GridIcon, ListIcon } from '@snt/ui/icons';
import { SideMenu } from '@/components/SideMenu';

export function CategorySide({
  categories,
  active,
  onChange,
}: {
  categories: (Category | 'all')[];
  active: Category | 'all';
  onChange: (value: Category | 'all') => void;
}) {
  return (
    <SideMenu
      title="Categories"
      icon={<ListIcon size={18} />}
      active={active}
      onChange={onChange}
      items={categories.map((value) => ({
        value,
        label: value === 'all' ? 'All' : CATEGORY_LABELS[value],
        icon: value === 'all' ? <GridIcon size={18} /> : <CategoryIcon category={value} size={18} />,
      }))}
    />
  );
}
