DELETE FROM "product_collection_attributes"
WHERE "attribute_key" IN (
  'dimensions',
  'battery_capacity',
  'storage_capacity',
  'gpu_model',
  'screen_resolution',
  'discount',
  'price'
);
