'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Differ = undefined;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

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

var _stylesheets = require('./stylesheets/stylesheets');

var _stylesheets2 = _interopRequireDefault(_stylesheets);

var _deviceSizes = require('./enums/device-sizes');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var imagemagick = _gm2.default.subClass({ imageMagick: true });

var renderHtml = function renderHtml(component, css, cssFile) {
  var wrapper = (0, _enzyme.render)(component);
  var html = wrapper.html();

  var stylesheets = new _stylesheets2.default();

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
  var reject = _ref.reject;
  var componentName = _ref.componentName;
  var html = _ref.html;
  var ref = _ref.ref;
  var path = _ref.path;
  var css = _ref.css;
  var viewportSize = _ref.viewportSize;

  _phantom2.default.create().then(function (ph) {
    ph.createPage().then(function (page) {
      page.property('viewportSize', viewportSize).then(function () {
        page.property('content', html).then(function () {
          // TODO figure out a better way to do this
          setTimeout(function () {
            var fullFileName = path + 'yours-' + componentName + '.png';
            page.render(fullFileName).then(function (e) {
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
  var viewportSize = _ref2$viewportSize === undefined ? _deviceSizes.DEVICE_SIZES.DESKTOP : _ref2$viewportSize;
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

        imagemagick().command('composite').in("-gravity", "center").in(path + 'difference.png').in(this.currentSnap).write(path + 'difference.png', function (err) {
          if (err) {
            reject(err);
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
    var promise = new Promise(function (resolve, reject) {
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
          differ.compareTo({ path: savePath, filename: 'theirs-' + componentName + '.png' }).then(function (areTheSame) {
            resolve(areTheSame);
          });
        }
      });
    });

    return promise;
  };
};

exports.Differ = Differ;
