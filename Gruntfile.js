module.exports = function(grunt) {
    // Project configuration
    grunt.initConfig({
      // Configure tasks
      eslint: {
        target: ['_airtable/*.js', '_helpers/*.js', '_middleware/*js', 'accounts/*.js', 'assistant/*.js', 'prompt/*.js'] // Specify files to lint
      },
      babel: {
        options: {
          presets: ['@babel/preset-env'] // Use babel preset-env for ES6+ compatibility
        },
        dist: {
          files: [{
            expand: true,
            cwd: '/',
            src: ['**/*.js'],
            dest: 'dist/'
          }]
        }
      },
      watch: {
        scripts: {
          files: ['/**/*.js'],
          tasks: ['eslint'] // Run eslint and tests when files change
        }
      }
    });
  
    // Load Grunt plugins
    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-watch');
  
    // Register default task
    grunt.registerTask('default', ['eslint', 'babel', 'watch']);
  };
  