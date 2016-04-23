'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Differ = exports.DEVICE_SIZES = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _enzyme = require('enzyme');

var _phantom = require('phantom');

var _phantom2 = _interopRequireDefault(_phantom);

var _imageDiff = require('image-diff');

var _imageDiff2 = _interopRequireDefault(_imageDiff);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _fileExists = require('file-exists');

var _fileExists2 = _interopRequireDefault(_fileExists);

var _gm = require('gm');

var _gm2 = _interopRequireDefault(_gm);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEVICE_SIZES = {
  MOBILE: { height: 800, width: 480 },
  TABLET: { height: 1200, width: 768 },
  DESKTOP: { height: 900, width: 1440 },

  IPAD: { height: 1024, width: 768 },
  IPAD_3RD_GEN: { height: 2048, width: 1536 },
  IPAD_PRO: { height: 2732, width: 2048 },
  IPHONE_4S: { height: 960, width: 640 },
  IPHONE_5: { height: 1136, width: 640 },
  IPHONE_6: { height: 1334, width: 750 },

  GALAXY_Y: { height: 320, width: 240 },
  GALAXY_ACE: { height: 400, width: 240 },
  GALAXY_SIII_MINI: { height: 800, width: 480 },
  GALAXY_SIII: { height: 1280, width: 720 },
  GALAXY_NEXUS: { height: 1280, width: 720 },
  GALAXY_S4: { height: 1920, width: 1080 },
  GALAXY_NOTE_III: { height: 1920, width: 1080 },
  GALAXY_NOTE_II: { height: 1280, width: 720 },
  GALAXY_MEGA: { height: 1280, width: 720 },
  GALAXY_MEGA_TV: { height: 960, width: 540 },
  GALAXY_TAB_2: { height: 960, width: 540 },
  GALAXY_TAB_3: { height: 1280, width: 800 },
  GALAXYNOTE_10_1: { height: 2560, width: 1600 },

  NEXUS_S: { height: 800, width: 480 },
  NEXUS_4: { height: 1200, width: 768 },
  NEXUS_5: { height: 1920, width: 1080 },
  NEXUS_7_1ST_GEN: { height: 1280, width: 800 },
  NEXUS_7_2ND_GEN: { height: 1824, width: 1200 },
  NEXUS_10: { height: 2560, width: 1600 },

  HTC_ONE_X: { height: 1280, width: 720 },
  HTC_ONE: { height: 1920, width: 1080 },
  HTC_ONE_MAX: { height: 1920, width: 1080 },

  KINDLE_FIRE_1ST_GEN: { height: 1024, width: 600 },
  KINDLE_FIRE_2ND_GEN: { height: 1024, width: 600 },
  KINDLE_FIRE_HD: { height: 1920, width: 1200 },
  KINDLE_FIRE_HDX: { height: 1920, width: 1200 }
};

exports.DEVICE_SIZES = DEVICE_SIZES;

var Stylesheets = function () {
  function Stylesheets() {
    _classCallCheck(this, Stylesheets);

    this.css = '';
  }

  _createClass(Stylesheets, [{
    key: 'addCSS',
    value: function addCSS(css) {
      this.css += css;
    }
  }, {
    key: 'addCSSFile',
    value: function addCSSFile(cssFilePath) {
      var css = _fs2.default.readFileSync(cssFilePath).toString();
      this.addCSS(css);
    }
  }, {
    key: 'createStyles',
    value: function createStyles() {
      return '<style>' + this.createReset() + this.css + '</style>';
    }
  }, {
    key: 'createReset',
    value: function createReset() {
      var reset = '\n/* http://meyerweb.com/eric/tools/css/reset/\n   v2.0 | 20110126\n   License: none (public domain)\n*/\n\nhtml, body, div, span, applet, object, iframe,\nh1, h2, h3, h4, h5, h6, p, blockquote, pre,\na, abbr, acronym, address, big, cite, code,\ndel, dfn, em, img, ins, kbd, q, s, samp,\nsmall, strike, strong, sub, sup, tt, var,\nb, u, i, center,\ndl, dt, dd, ol, ul, li,\nfieldset, form, label, legend,\ntable, caption, tbody, tfoot, thead, tr, th, td,\narticle, aside, canvas, details, embed,\nfigure, figcaption, footer, header, hgroup,\nmenu, nav, output, ruby, section, summary,\ntime, mark, audio, video {\n    margin: 0;\n    padding: 0;\n    border: 0;\n    font-size: 100%;\n    font: inherit;\n    vertical-align: baseline;\n}\n/* HTML5 display-role reset for older browsers */\narticle, aside, details, figcaption, figure,\nfooter, header, hgroup, menu, nav, section {\n    display: block;\n}\nbody {\n    line-height: 1;\n}\nol, ul {\n    list-style: none;\n}\nblockquote, q {\n    quotes: none;\n}\nblockquote:before, blockquote:after,\nq:before, q:after {\n    content: \'\';\n    content: none;\n}\ntable {\n    border-collapse: collapse;\n    border-spacing: 0;\n}\n';
      return reset;
    }
  }]);

  return Stylesheets;
}();

var imagemagick = _gm2.default.subClass({ imageMagick: true });

var renderHtml = function renderHtml(component, css, cssFile) {
  var wrapper = (0, _enzyme.render)(component);
  var html = wrapper.html();

  var stylesheets = new Stylesheets();

  if (css) {
    stylesheets.addCSS(css);
  }

  if (cssFile) {
    stylesheets.addCSSFile(cssFile);
  }

  html = '<html><head>' + stylesheets.createStyles() + '</head><body>' + html + '</body></html>';

  return html;
};

var createScreenshot = function createScreenshot(_ref) {
  var resolve = _ref.resolve;
  var componentName = _ref.componentName;
  var html = _ref.html;
  var ref = _ref.ref;
  var path = _ref.path;
  var viewportSize = _ref.viewportSize;

  _phantom2.default.create().then(function (ph) {
    ph.createPage().then(function (page) {
      page.property('viewportSize', viewportSize).then(function () {
        page.property('content', html).then(function () {
          // TODO figure out a better way to do this
          setTimeout(function () {
            var fullFileName = path + 'yours-' + componentName + '.png';
            page.render(fullFileName).then(function () {
              ph.exit();
              ref.currentSnap = fullFileName;
              resolve(ref);
            });
          }, 1000);
        });
      });
    });
  });
};

/**
 * Constructor
 */
var Differ = function Differ(_ref2) {
  var _this = this;

  var componentName = _ref2.componentName;
  var component = _ref2.component;
  var savePath = _ref2.savePath;
  var _ref2$viewportSize = _ref2.viewportSize;
  var viewportSize = _ref2$viewportSize === undefined ? DEVICE_SIZES.DESKTOP : _ref2$viewportSize;
  var _ref2$css = _ref2.css;
  var css = _ref2$css === undefined ? '' : _ref2$css;
  var _ref2$cssFile = _ref2.cssFile;
  var cssFile = _ref2$cssFile === undefined ? false : _ref2$cssFile;
  var _ref2$threshold = _ref2.threshold;
  var threshold = _ref2$threshold === undefined ? 0 : _ref2$threshold;
  var _ref2$onSnapshotsUpda = _ref2.onSnapshotsUpdated;
  var onSnapshotsUpdated = _ref2$onSnapshotsUpda === undefined ? function () {} : _ref2$onSnapshotsUpda;
  var _ref2$updateSnapshots = _ref2.updateSnapshots;
  var updateSnapshots = _ref2$updateSnapshots === undefined ? false : _ref2$updateSnapshots;
  var _ref2$onSnapshotCreat = _ref2.onSnapshotCreated;
  var onSnapshotCreated = _ref2$onSnapshotCreat === undefined ? function () {} : _ref2$onSnapshotCreat;
  var _ref2$createSnapshots = _ref2.createSnapshots;
  var createSnapshots = _ref2$createSnapshots === undefined ? false : _ref2$createSnapshots;

  this.currentSnap = null;
  this.currentDiff = null;
  this.html = renderHtml(component, css, cssFile);

  this.snap = function (_ref3) {
    var _ref3$path = _ref3.path;
    var path = _ref3$path === undefined ? './' : _ref3$path;

    var promise = new Promise(function (resolve, reject) {
      createScreenshot({
        resolve: resolve,
        reject: reject,
        componentName: componentName,
        html: _this.html,
        path: path,
        ref: _this,
        viewportSize: viewportSize
      });
    });

    return promise;
  };

  this.compareTo = function (_ref4) {
    var path = _ref4.path;
    var filename = _ref4.filename;

    var promise = new Promise(function (resolve, reject) {
      _this.currentDiff = path + 'difference.png';
      (0, _imageDiff2.default)({
        actualImage: path + filename,
        expectedImage: _this.currentSnap,
        diffImage: path + 'difference.png',
        threshold: threshold
      }, function (err, imagesAreSame) {
        if (err) {
          reject(err);
        }

        imagemagick().command('composite').in('-gravity', 'center').in(path + 'difference.png').in(this.currentSnap).write(path + 'difference.png', function (err2) {
          if (err2) {
            reject(err2);
          }

          resolve(imagesAreSame);
        });
      }.bind(_this));
    });

    return promise;
  };

  this.moveSnapshot = function (_ref5) {
    var path = _ref5.path;
    var filename = _ref5.filename;

    _fs2.default.renameSync(_this.currentSnap, path + filename);

    return true;
  };

  this.cleanup = function () {
    if ((0, _fileExists2.default)(_this.currentSnap)) {
      _fs2.default.unlinkSync(_this.currentSnap);
    }

    if ((0, _fileExists2.default)(_this.currentDiff)) {
      _fs2.default.unlinkSync(_this.currentDiff);
    }
  };

  this.compare = function () {
    var promise = new Promise(function (resolve) {
      _this.snap({ path: savePath }).then(function (differ) {
        var willHandleUpdate = false;

        if (process.env.UPDATE_SNAPSHOTS || updateSnapshots) {
          willHandleUpdate = true;

          if (typeof process.env.UPDATE_SNAPSHOTS === 'string' && process.env.UPDATE_SNAPSHOTS !== '1' && process.env.UPDATE_SNAPSHOTS !== 'true') {
            // We are trying to update a specific component
            // Flag componentNames that are not the one specified
            // as false.
            if (process.env.UPDATE_SNAPSHOTS !== componentName) {
              willHandleUpdate = false;
            }
          }
        }

        if (willHandleUpdate) {
          differ.moveSnapshot({ path: savePath, filename: 'theirs-' + componentName + '.png' });
          differ.cleanup();
          onSnapshotsUpdated();
        } else if (process.env.CREATE_SNAPSHOTS || createSnapshots) {
          var created = false;
          if (!(0, _fileExists2.default)(savePath + 'theirs-' + componentName + '.png')) {
            differ.moveSnapshot({ path: savePath, filename: 'theirs-' + componentName + '.png' });
            created = true;
          }

          differ.cleanup();
          onSnapshotCreated(created);
        } else {
          differ.compareTo({
            path: savePath,
            filename: 'theirs-' + componentName + '.png'
          }).then(function (areTheSame) {
            resolve(areTheSame);
          });
        }
      });
    });

    return promise;
  };
};

exports.Differ = Differ;
