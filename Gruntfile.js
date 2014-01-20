module.exports = function(grunt) {
  var browsers = [{
    browserName: "chrome"
  }, {
    browserName: "firefox"
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
    platform: "OS X 10.9",
    version: "7"
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
    version: "4.0",
    "device-orientation": "portrait"
  }, {
    browserName: "android",
    platform: "linux",
    version: "4.0",
    "device-type": "tablet",
    "device-orientation": "portrait"
  }];

  var covDirectory = "coverage";
  var srcFiles = ["cbor.js"];
  var testFile = "test/index.html";
  var testPort = 9999;

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
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
      all: {
        options: {
          urls: [testFile],
          coverage: {
            src: srcFiles,
            instrumentedFiles: "temp/",
            lcovReport: covDirectory,
            branchesThresholdPct: 95,
            functionsThresholdPct: 100,
            linesThresholdPct: 95
          }
        }
      }
    },
    "saucelabs-qunit": {
      all: {
        options: {
          urls: ["http://localhost:" + testPort + "/" + testFile],
          build: process.env.TRAVIS_JOB_NUMBER || "unknown",
          browsers: browsers,
          concurrency: 3,
          tags: [process.env.TRAVIS_BRANCH || "unknown"]
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-qunit");
  grunt.loadNpmTasks("grunt-coveralls");
  grunt.loadNpmTasks("grunt-qunit-istanbul");
  grunt.loadNpmTasks("grunt-saucelabs");

  grunt.registerTask("default", ["test"]);
  grunt.registerTask("test", ["qunit", "jshint"]);
  grunt.registerTask("ci", ["test", "coveralls", "connect", "saucelabs-qunit"]);
};
