module.exports = (grunt) => {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    eslint: {
      target: [
        './client/js/modules/*.js',
        './client/js/modules/**/*.js',
        './client/js/app.js',
      ],
      options: {
        configFile: './eslint.json',
        globals: ['$', 'SimpleBar'],
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
  });

  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify-es');
  grunt.registerTask('default', [
    'browserify',
  ]);
};
