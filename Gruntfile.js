module.exports = function (grunt){
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-include-replace');
    grunt.loadNpmTasks('grunt-contrib-jasmine');

    grunt.initConfig({
        uglify: {
            options: {
                banner: '/* Gamekit\n' +
                        ' * =======\n' +
                        ' * @license: CC BY-NC 3.0 (http://creativecommons.org/licenses/by-nc/3.0/)\n' +
                        ' * @license: Request commercial licenses from hello@wearekiss.com\n' +
                        ' * @author: Christian Engel <hello@wearekiss.com>\n' +
                        ' * @updated: ' + (new Date()).toDateString() + '\n' +
                        ' */\n'
            },
            dist: {
                src: 'dist/gamekit.js',
                dest: 'dist/gamekit.min.js'
            }
        },
        concat: {
            options: {
                banner: '/* Gamekit\n' +
                        ' * =======\n' +
                        ' * @license: CC BY-NC 3.0 (http://creativecommons.org/licenses/by-nc/3.0/)\n' +
                        ' * @license: Request commercial licenses from hello@wearekiss.com\n' +
                        ' * @author: Christian Engel <hello@wearekiss.com>\n' +
                        ' * @updated: ' + (new Date()).toDateString() + '\n' +
                        ' */\n' +
                        '(function(){',
                footer: '})();'
            },
            dist: {
                src: ['src/**'],
                dest: 'dist/gamekit.js'
            }
        },
        watch: {
            scripts: {
                files: ['src/*.js'],
                tasks: ['includereplace', 'uglify'],
                options: {
                    nospawn: true
                }
            }
        },
        includereplace: {
            main: {
                options: {
                    prefix: '//@@'
                },
                files: {
                    'dist/' : ['src/gamekit.js']
                }
            }
        },
        jasmine: {
            gamekit: {
                options: {
                    specs: 'test/spec.html',
                },
                src: 'src/gamekit.js'
            }
        }
    });

    grunt.registerTask('default', ['includereplace', 'uglify']);
    grunt.registerTask('test', ['jasmine']);
};