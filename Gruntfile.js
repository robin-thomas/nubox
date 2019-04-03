module.exports = (grunt) => {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    eslint: {
      target: [
        './client/js/modules/*.js',
        './client/js/modules/**/*.js',
        './client/js/app.js',
        './server/*.js',
      ],
      options: {
        configFile: './eslint.json',
        globals: ['$', 'SimpleBar', 'chrome', 'nuBox'],
      },
    },
    run: {
      options: {

      },
      npmtest: {
        cmd: 'npm',
        args: [
          'test',
        ],
      },
    },
    browserify: {
      target: {
        src: [ './client/js/app.js' ],
        dest: './client/js/index.js',
        options: {
          require: ['web3'],
        },
      },
    },
    uglify: {
      target: {
        src: './client/js/index.js',
        dest: './client/js/index.min.js'
      }
    },
    cssmin: {
      options: {
        mergeIntoShorthands: false,
        roundingPrecision: -1
      },
      target: {
        files: {
          './client/css/index.min.css': ['./client/css/index.css', './client/css/style.css']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify-es');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.registerTask('default', [
    'eslint',
    'browserify',
    'uglify',
    'cssmin'
  ]);
};
