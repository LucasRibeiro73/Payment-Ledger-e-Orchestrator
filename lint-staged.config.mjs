export default {
  '*.{ts,mts,mjs}': ['eslint --fix --max-warnings=0', 'prettier --write'],
  '*.{json,md,yml,yaml}': 'prettier --write',
};
