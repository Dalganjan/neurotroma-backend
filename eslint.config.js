const js = requie('eslint');

export default [
    js.configs.recommended,

   {
       rules: {
           "no-unused-vars": "warn",
           "no-undef": "warn"
       }
   }
];