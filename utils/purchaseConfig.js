// Purchase configuration for Snapture app
export const PURCHASE_SKUS = {
  // Print Services
  SINGLE_PRINT: 'com.pixprintstudio.snapture.print.single',
  PRINT_BUNDLE_5: 'com.pixprintstudio.snapture.print.bundle5',
  PRINT_BUNDLE_10: 'com.pixprintstudio.snapture.print.bundle10',
  PREMIUM_PRINTS: 'com.pixprintstudio.snapture.print.premium',
  
  // Subscription Services
  PREMIUM_MONTHLY: 'com.pixprintstudio.snapture.premium.monthly',
  PREMIUM_YEARLY: 'com.pixprintstudio.snapture.premium.yearly',
  PRO_MONTHLY: 'com.pixprintstudio.snapture.pro.monthly',
  
  // Event Features
  UNLIMITED_EVENTS: 'com.pixprintstudio.snapture.event.unlimited',
  EXTRA_STORAGE_1GB: 'com.pixprintstudio.snapture.storage.1gb',
  EXTRA_STORAGE_5GB: 'com.pixprintstudio.snapture.storage.5gb',
  
  // Photo Enhancements
  PREMIUM_FILTERS: 'com.pixprintstudio.snapture.filters.premium',
  AR_FILTERS_PACK: 'com.pixprintstudio.snapture.filters.ar',
  TEMPLATE_PACK_WEDDING: 'com.pixprintstudio.snapture.templates.wedding',
  TEMPLATE_PACK_PARTY: 'com.pixprintstudio.snapture.templates.party'
};

export const PRODUCT_TYPES = {
  CONSUMABLE: 'consumable',
  NON_CONSUMABLE: 'non_consumable',
  SUBSCRIPTION: 'subscription'
};

export const PURCHASE_CONFIG = {
  [PURCHASE_SKUS.SINGLE_PRINT]: {
    type: PRODUCT_TYPES.CONSUMABLE,
    title: 'Single Photo Print',
    description: 'Print one high-quality photo instantly'
  },
  [PURCHASE_SKUS.PRINT_BUNDLE_5]: {
    type: PRODUCT_TYPES.CONSUMABLE,
    title: '5 Photo Print Bundle',
    description: 'Print 5 photos with bundle discount'
  },
  [PURCHASE_SKUS.PREMIUM_MONTHLY]: {
    type: PRODUCT_TYPES.SUBSCRIPTION,
    title: 'Premium Monthly',
    description: 'Unlimited prints and premium features'
  },
  [PURCHASE_SKUS.PREMIUM_FILTERS]: {
    type: PRODUCT_TYPES.NON_CONSUMABLE,
    title: 'Premium Filters Pack',
    description: 'Access to exclusive photo filters'
  }
};