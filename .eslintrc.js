module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json", "./tsconfig.eslint.json"],
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint"],
  extends: ["airbnb-base", "airbnb-typescript/base", "prettier"],
  rules: {
    "import/prefer-default-export": "off",
    "no-restricted-syntax": "off",
    "class-methods-use-this": "off", // https://github.com/airbnb/javascript#classes--methods-use-this
    "no-underscore-dangle": "off", // we allow use `_`: this._privateMethod = ...;
  },
};
