DELETE FROM "product_collection_attributes" AS pca
USING "product_collections" AS pc
WHERE pca."collection_id" = pc."id"
  AND pc."key" = 'displays'
  AND pca."attribute_key" IN (
    'stand_adjustments',
    'speakers',
    'adaptive_sync',
    'touchscreen',
    'discount',
    'price'
  );
