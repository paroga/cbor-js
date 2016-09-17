module.exports = function(grunt) {
  var browsers = [{
    browserName: "chrome"
  }, {
    browserName: "firefox",
    platform: "Windows 7"
  }, {
    browserName: "opera"
  }, {
    browserName: "internet explorer",
    platform: "Windows 8.1",
    version: "11"
  }, {
    browserName: "internet explorer",
    platform: "Windows 7",
    version: "10"
  }, {
    browserName: "safari",
    platform: "OS X 10.10",
    version: "8"
  }, {
    browserName: "safari",
    platform: "OS X 10.8",
    version: "6"
  }, {
    browserName: "ipad",
    platform: "OS X 10.8",
    version: "6",
    "device-orientation": "portrait"
  }, {
    browserName: "iphone",
    platform: "OS X 10.8",
    version: "6",
    "device-orientation": "portrait"
  }, {
    browserName: "android",
    platform: "linux",
    version: "5.1",
    "device-orientation": "portrait"
  }, {
    browserName: "android",
    platform: "linux",
    version: "4.0",
    "device-orientation": "portrait"
  }];

  var covDirectory = "coverage";
  var srcFiles = ["cbor.js"];
  var testFile = "test/index.html";
  var testFileMin = "test/index.min.html";
  var testPort = 9999;
  var testBaseURL = "http://localhost:" + testPort + "/";

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    "bower-install-simple": {
      all: {
        options: {
          production: false
        }
      }
    },
    compress: {
      all: {
        options: {
          archive: 'cbor-js.zip',
          mode: 'zip'
        },
        files: [
          { src: 'LICENSE' },
          { src: 'README.md' },
          { src: 'cbor.js' },
          { src: 'cbor.min.js' }
        ]
      }
    },
    connect: {
      server: {
        options: {
          base: "",
          port: testPort
        }
      }
    },
    coveralls: {
      all: {
        src: covDirectory + "/lcov.info"
      }
    },
    jshint: {
      options: {
        "camelcase": true,
        "eqeqeq": true,
        "eqnull": true,
        "forin": true,
        "freeze": true,
        "immed": true,
        "latedef": true,
        "newcap": true,
        "noarg": true,
        "noempty": true,
        "nonew": true,
        "quotmark": "double",
        "strict": true,
        "trailing": true,
        "unused": true
      },
      all: srcFiles
    },
    qunit: {
      min: {
        options: {
          urls: [testFileMin]
        }
      },
      src: {
        options: {
          urls: [testFile],
          coverage: {
            src: srcFiles,
            instrumentedFiles: "temp/",
            lcovReport: covDirectory,
            branchesThresholdPct: 100,
            functionsThresholdPct: 100,
            linesThresholdPct: 100
          }
        }
      }
    },
    "saucelabs-qunit": {
      all: {
        options: {
          urls: [testBaseURL + testFile, testBaseURL + testFileMin],
          build: process.env.TRAVIS_JOB_NUMBER || "unknown",
          browsers: browsers,
          statusCheckAttempts: -1,
          tags: [process.env.TRAVIS_BRANCH || "unknown"],
          throttled: 6
        }
      }
    },
    uglify: {
      options: {
        banner: "// <%= pkg.name %> v<%= pkg.version %> - <%= pkg.author %> - Licensed under <%= pkg.license %>\n"
      },
      all: {
        files: {
          "cbor.min.js": ["cbor.js"]
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-bower-install-simple");
  grunt.loadNpmTasks("grunt-contrib-compress");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-qunit");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-coveralls");
  grunt.loadNpmTasks("grunt-qunit-istanbul");
  grunt.loadNpmTasks("grunt-saucelabs");

  grunt.registerTask("default", ["test"]);
  grunt.registerTask("test", ["bower-install-simple", "qunit:src", "jshint"]);
  grunt.registerTask("test-min", ["bower-install-simple", "uglify", "qunit:min"]);
  grunt.registerTask("ci", ["test", "coveralls", "test-min", "connect", "saucelabs-qunit", "compress"]);
};
