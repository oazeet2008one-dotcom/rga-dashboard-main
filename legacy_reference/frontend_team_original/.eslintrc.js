module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Disable TypeScript specific rules for JS files
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    // Allow JS files
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off'
  },
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      rules: {
        // Disable TypeScript rules for JS files
        '@typescript-eslint/*': 'off'
      }
    }
  ]
};
