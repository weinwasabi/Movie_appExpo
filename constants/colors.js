// Theme colours, shared by tailwind.config.js (as class names) and components whose
// colour is a prop rather than a style (ActivityIndicator, Image tintColor).
// CommonJS so the Tailwind config can require it in Node.
module.exports = {
  primary: '#030014',
  secondary: '#151312',
  light: {
    100: '#D6C6FF',
    200: '#A8B5DB',
    300: '#9CA4AB',
  },
  dark: {
    100: '#221f3d',
    200: '#0f0d23',
  },
  accent: '#AB8BFF',
};
