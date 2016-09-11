module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-scss-lint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-postcss');

    grunt.initConfig({
        // Sass
        sass: {
            options: {
                sourceMap: false
            },
            style: {
                files: [{
                    expand: true,
                    cwd: 'scss',
                    src: ['style.scss'],
                    dest: 'css',
                    ext: '.css'
                }]
            }
        },
        postcss: {
            options: {
                map: {
                    inline: false
                },
                processors: [
                    require('autoprefixer')({
                        browsers: ['last 2 Chrome versions',
                                   'last 2 ChromeAndroid versions',
                                   'Android > 0',
                                   'last 2 Safari versions'],
                    })
                ]
            },
            dist: {
                src: 'css/*.css'
            }
        },
        watch: {
            scss: {
                files: ['**/*.scss'],
                tasks: ['build_css'],
                options: {
                    livereload: true,
                },
            }
        },
        scsslint: {
            allFiles: ['scss/**/*.scss'],
            options: {
                config: '.scss-lint.yml',
                compact: true,
                reporterOutput: 'scss-lint-report.xml',
                colorizeOutput: true
            }
        }
    });

    grunt.registerTask('build_css', ['sass:style', 'postcss']);
    grunt.registerTask('build', ['build_css']);
    grunt.registerTask('lint', ['lint_css']);
    grunt.registerTask('lint_css', ['scsslint']);
    grunt.registerTask('default', ['build_css']);
};