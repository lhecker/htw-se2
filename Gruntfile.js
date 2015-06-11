'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// If you want to recursively match all subfolders, use:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
	// time how long tasks take
	require('time-grunt')(grunt);

	// load grunt tasks automatically
	// (additionally we need to map irregular names to the matching module)
	require('jit-grunt')(grunt, {
		useminPrepare: 'grunt-usemin',
	});

	grunt.initConfig({
		// automatically rebuild on changes
		watch: {
			bower: {
				files: ['bower.json'],
				tasks: ['wiredep'],
			},
			jstest: {
				files: ['test/spec/{,*/}*.js'],
				tasks: ['test:watch'],
			},
			gruntfile: {
				files: ['Gruntfile.js'],
			},
			less: {
				files: ['app/styles/{,*/}*.less'],
				tasks: ['less:server', 'postcss']
			},
			styles: {
				files: ['app/styles/{,*/}*.css'],
				tasks: ['newer:copy:styles', 'postcss'],
			},
		},

		// serve the compiled files for development purposes
		browserSync: {
			options: {
				notify: false,
				background: true,
			},
			livereload: {
				options: {
					files: [
						'app/{,*/}*.html',
						'app/images/{,*/}*',
						'.tmp/styles/{,*/}*.css',
						'.tmp/scripts/{,*/}*.js',
					],
					port: 9000,
					server: {
						baseDir: ['.tmp', 'app'],
						routes: {
							'/bower_components': './bower_components',
						},
					},
				},
			},
			test: {
				options: {
					port: 9001,
					open: false,
					logLevel: 'silent',
					host: 'localhost',
					server: {
						baseDir: ['.tmp', './test', 'app'],
						routes: {
							'/bower_components': './bower_components',
						},
					},
				},
			},
			dist: {
				options: {
					background: false,
					server: 'dist',
				},
			},
		},

		// clean the temporary and distribution folder before builds
		clean: {
			dist: {
				files: [{
					dot: true,
					src: [
						'.tmp',
						'dist/*',
						'!dist/.git*',
					],
				}],
			},
			server: '.tmp',
		},

		// jshint...
		jshint: {
			options: {
				jshintrc: '.jshintrc',
				reporter: require('jshint-stylish'),
			},
			all: [
				'Gruntfile.js',
				'app/scripts/{,*/}*.js',
				'!app/scripts/vendor/*',
				'test/spec/{,*/}*.js',
			],
		},

		// testing
		karma: {
			all: {
				configFile: 'test/karma.conf.js',
			},
		},

		// transpiles LESS to CSS
		less: {
			options: {
				sourceMap: true,
				strictMath: true,
				paths: ['bower_components'],
			},
			dist: {
				files: {
					'.tmp/styles/main.css': 'app/styles/main.less',
				},
			},
			server: {
				files: {
					'.tmp/styles/main.css': 'app/styles/main.less',
				},
			},
		},

		// "autoprefix" the CSS
		postcss: {
			options: {
				processors: [
					require('autoprefixer-core')({
						browsers: ['last 1 version', '> 1% in DE']
					}),
				],
				map: {
					prev: '.tmp/styles/',
				},
			},
			dist: {
				files: [{
					expand: true,
					cwd: '.tmp/styles/',
					src: '{,*/}*.css',
					dest: '.tmp/styles/',
				}],
			}
		},

		// transpiles ES6 and JSX code to plain ES5
		browserify: {
			options: {
				watch: true,
				transform: [
					[{
						sourceMap: true,
						stage: 4,
						optional: ['runtime'],
					}, 'babelify'],
				],
				browserifyOptions: {
					extensions: ['.jsx'],
					fullPaths: true,
					debug: true,
				},
			},
			server: {
				src: 'app/scripts/main.jsx',
				dest: '.tmp/scripts/main.js',
			},
			dist: {
				options: {
					watch: false,
					browserifyOptions: {
						extensions: ['.jsx'],
						fullPaths: false,
						debug: false,
					},
					plugin: ['bundle-collapser/plugin'],
				},
				src: 'app/scripts/main.jsx',
				dest: '.tmp/scripts/main.js',
			},
			test: {
				src: 'test/spec/test.js',
				dest: '.tmp/spec/main.js',
			},
		},

		// automatically inject Bower components into the HTML file
		wiredep: {
			app: {
				ignorePath: /^\/|\.\.\//,
				src: ['app/index.html'],
			},
			less: {
				src: ['app/styles/{,*/}*.less'],
				ignorePath: /(\.\.\/){1,2}bower_components\//
			}
		},

		// Reads HTML for usemin blocks to enable smart builds that automatically
		// concat, minify and revision files. Creates configurations in memory so
		// additional tasks can operate on them.
		useminPrepare: {
			options: {
				dest: 'dist',
			},
			html: 'app/index.html',
		},

		// performs rewrites based on rev and the useminPrepare configuration
		usemin: {
			options: {
				assetsDirs: [
					'dist',
					'dist/images',
					'dist/styles',
				],
			},
			html: ['dist/{,*/}*.html'],
			css: ['dist/styles/{,*/}*.css'],
		},

		// renames files for browser caching purposes
		filerev: {
			dist: {
				src: [
					'dist/scripts/{,*/}*.js',
					'dist/styles/{,*/}*.css',
					'dist/images/{,*/}*.*',
					'dist/styles/fonts/{,*/}*.*',
					'dist/*.{ico,png}',
				],
			},
		},

		// the following *min tasks produce minified files in the dist folder
		imagemin: {
			dist: {
				files: [{
					expand: true,
					cwd: 'app/images',
					src: '{,*/}*.{gif,jpeg,jpg,png}',
					dest: 'dist/images',
				}],
			},
		},

		svgmin: {
			dist: {
				files: [{
					expand: true,
					cwd: 'app/images',
					src: '{,*/}*.svg',
					dest: 'dist/images',
				}],
			},
		},

		htmlmin: {
			dist: {
				options: {
					collapseBooleanAttributes: true,
					collapseWhitespace: true,
					keepClosingSlash: true,
					removeAttributeQuotes: true,
					removeCommentsFromCDATA: true,
					removeEmptyAttributes: true,
					removeOptionalTags: true,
					removeRedundantAttributes: true,
					useShortDoctype: true,
				},
				files: [{
					expand: true,
					cwd: 'dist',
					src: '{,*/}*.html',
					dest: 'dist',
				}],
			},
		},

		// By default, your `index.html`'s <!-- Usemin block --> will take care
		// of minification. These next options are pre-configured if you do not
		// wish to use the Usemin blocks.
		// cssmin: {
		//   dist: {
		//     files: {
		//       'dist/styles/main.css': [
		//         '.tmp/styles/{,*/}*.css',
		//         'app/styles/{,*/}*.css'
		//       ]
		//     }
		//   }
		// },
		// uglify: {
		//   dist: {
		//     files: {
		//       'dist/scripts/scripts.js': [
		//         'dist/scripts/scripts.js'
		//       ]
		//     }
		//   }
		// },
		// concat: {
		//   dist: {}
		// },

		// Copies remaining files to places other tasks can use
		copy: {
			dist: {
				files: [{
					expand: true,
					dot: true,
					cwd: 'app',
					dest: 'dist',
					src: [
						'images/{,*/}*.webp',
						'fonts/{,*/}*.*',
						'{,*/}*.html',
						'*.{ico,png,txt}',
					],
				}, {
					expand: true,
					dot: true,
					cwd: 'bower_components/bootstrap/dist',
					src: 'fonts/*',
					dest: 'dist',
				}],
			},
			styles: {
				expand: true,
				dot: true,
				cwd: 'app/styles',
				dest: '.tmp/styles/',
				src: '{,*/}*.css',
			},
		},

		// run some tasks in parallel to speed up build process
		concurrent: {
			server: [
				'browserify:server',
				'less:server',
				'copy:styles',
			],
			dist: [
				'browserify:dist',
				'less:dist',
				'copy:styles',

				'imagemin',
				'svgmin',
			],
		},
	});


	grunt.registerTask('serve', 'starts a server to preview your app', function (target) {
		if (target === 'dist') {
			return grunt.task.run(['build', 'browserSync:dist']);
		}

		grunt.task.run([
			'clean:server',
			'wiredep',
			'concurrent:server',
			'postcss',                // depends on the results of less:server
			'browserSync:livereload',
			'watch',
		]);
	});

	grunt.registerTask('test', function (target) {
		grunt.task.run([
			'clean:server',
			'wiredep',
			'browserify:test',
			'karma',
		]);
	});

	grunt.registerTask('build', function (target) {
		grunt.task.run([
			'clean:dist',
			'wiredep',
			'useminPrepare',
			'concurrent:dist',
			'postcss',
			'concat',
			'cssmin',
			'uglify',
			'copy:dist',
			'filerev',
			'usemin',
			'htmlmin',
		]);
	});

	grunt.registerTask('default', [
		'newer:jshint',
		'test',
		'build',
	]);
};
