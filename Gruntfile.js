module.exports = function(grunt) {
    // Project configuration
    grunt.initConfig({
      // Configure task
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
      }
    });
  
    // Load Grunt plugins
    grunt.loadNpmTasks('grunt-babel');
  
    // Register default task
    grunt.registerTask('default', ['babel']);
  };
  