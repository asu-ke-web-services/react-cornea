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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var renderHtml = function renderHtml(component) {
  var wrapper = (0, _enzyme.render)(component);
  var html = wrapper.html();
  html = '<html><body>' + html + '</body></html>';

  return html;
};

var createScreenshot = function createScreenshot(_ref) {
  var resolve = _ref.resolve;
  var reject = _ref.reject;
  var componentName = _ref.componentName;
  var html = _ref.html;
  var ref = _ref.ref;
  var path = _ref.path;

  _phantom2.default.create().then(function (ph) {
    ph.createPage().then(function (page) {
      page.property('viewportSize', {
        width: 1440,
        height: 900
      }).then(function () {
        page.property('content', html).then(function () {
          // TODO figure out a better way to do this
          setTimeout(function () {
            var fullFileName = path + 'latest-' + componentName + '.png';
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

// TODO support multiple viewport sizes
// TODO support stylesheet injection
var Differ = function Differ(_ref2) {
  var _this = this;

  var componentName = _ref2.componentName;
  var component = _ref2.component;

  this.currentSnap = null;
  this.currentDiff = null;
  this.html = renderHtml(component);

  this.snap = function (_ref3) {
    var _ref3$path = _ref3.path;
    var path = _ref3$path === undefined ? './' : _ref3$path;

    var promise = new Promise(function (resolve, reject) {
      createScreenshot({
        resolve: resolve, reject: reject, componentName: componentName, html: _this.html, path: path,
        ref: _this
      });
    });

    return promise;
  };

  this.compareTo = function (_ref4) {
    var path = _ref4.path;
    var filename = _ref4.filename;
    var _ref4$threshold = _ref4.threshold;
    var threshold = _ref4$threshold === undefined ? 0 : _ref4$threshold;

    var promise = new Promise(function (resolve, reject) {
      _this.currentDiff = path + 'difference.png';
      (0, _imageDiff2.default)({
        actualImage: path + filename,
        expectedImage: _this.currentSnap,
        diffImage: path + 'difference.png',
        threshold: threshold
      }, function (err, imagesAreSame) {
        resolve(imagesAreSame);
      });
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
};

exports.Differ = Differ;
