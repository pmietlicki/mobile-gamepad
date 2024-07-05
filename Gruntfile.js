var config = require('./config/config');

module.exports = function(grunt) {
  var server;

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    debug: {
      options: {
        open: false // do not open node-inspector in Chrome automatically
      }
    },
    open: {
      dev: {
        path: 'http://127.0.0.1:' + process.env.PORT
      }
    },

    watch: {
      options: {
        livereload: true
      },
      public: {
        files: ['public/**/*'],
        tasks: ['copy:public']
      },
      client: {
        files: ['client/**/*'],
        tasks: ['copy:client']
      },
      server: {
        files: ['config/config.js', 'server/*'],
        tasks: ['express:dev'],
        options: {
          spawn: false
        }
      }
    },

    copy: {
      public: {
        expand: true,
        cwd: 'public/',
        src: ['**'],
        dest: 'dist/public/'
      },
      client: {
        expand: true,
        cwd: 'client/',
        src: ['**'],
        dest: 'dist/public/'
      }
    },

    clean: {
      dist: ['dist/']
    },

    express: {
      dev: {
        options: {
          port: config.port,
          script: 'server/server.js',
          background: true,
          delay: 5000 // Add a delay to ensure the server starts properly
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-open');

  grunt.registerTask('default', [
    'clean', 'copy'
  ]);

  grunt.registerTask('start', [
    'default', 'express', 'watch'
  ]);

  grunt.registerTask('development', [
    'default', 'express', 'open:dev', 'watch'
  ]);

  grunt.registerTask('express-keepalive', 'Keep grunt running', function() {
    this.async();
  });

  grunt.registerTask('express-server', function(target) {
    if (target === 'dev') {
      server = require('child_process').fork('server/server.js');
    }
  });

  grunt.event.on('watch', function(action, filepath, target) {
    if (target === 'server') {
      if (server) {
        server.kill('SIGTERM');
        server = null;
      }
      grunt.task.run(['express-server:dev']);
    }
  });

};
