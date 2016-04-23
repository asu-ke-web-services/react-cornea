import {render} from 'enzyme';
import phantom from 'phantom';
import imageDiff from 'image-diff';
import fs from 'fs';
import fileExists from 'file-exists';
import gm from 'gm';

import { default as Stylesheets } from './stylesheets/stylesheets';

import { DEVICE_SIZES } from './enums/device-sizes';

let imagemagick = gm.subClass({ imageMagick: true });

const renderHtml = (component, css, cssFile) => {
  const wrapper = render(component);
  let html = wrapper.html();

  const stylesheets = new Stylesheets();

  if (css) {
    stylesheets.addCSS(css);
  }

  if (cssFile) {
    stylesheets.addCSSFile(cssFile);
  }

  html = '<html><head>' + stylesheets.createStyles() + '</head><body>' + html + '</body></html>';

  return html;
};

const createScreenshot = ({
  resolve,
  componentName,
  html,
  ref,
  path,
  viewportSize
}) => {
  phantom.create().then((ph) => {
    ph.createPage().then((page) => {
      page.property('viewportSize', viewportSize).then(() => {
        page.property('content', html).then(() => {
          // TODO figure out a better way to do this
          setTimeout(() => {
            let fullFileName = path + 'yours-' + componentName + '.png';
            page.render(fullFileName).then(() => {
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
const Differ = function ({
    componentName,
    component,
    savePath,
    viewportSize = DEVICE_SIZES.DESKTOP,
    css = '',
    cssFile = false,
    threshold = 0,
    onSnapshotsUpdated = () => {},
    updateSnapshots = false,
    onSnapshotCreated = () => {},
    createSnapshots = false,
}) {
  this.currentSnap = null;
  this.currentDiff = null;
  this.html = renderHtml(component, css, cssFile);

  this.snap = ({ path = './' }) => {
    let promise = new Promise((resolve, reject) => {
      createScreenshot({
        resolve,
        reject,
        componentName,
        html: this.html,
        path,
        ref: this,
        viewportSize
      });
    });

    return promise;
  };

  this.compareTo = ({ path, filename }) => {
    let promise = new Promise((resolve, reject) => {
      this.currentDiff = path + 'difference.png';
      imageDiff({
        actualImage: path + filename,
        expectedImage: this.currentSnap,
        diffImage: path + 'difference.png',
        threshold
      }, function (err, imagesAreSame) {
        if (err) {
          reject(err);
        }

        imagemagick().command('composite')
          .in('-gravity', 'center')
          .in(path + 'difference.png')
          .in(this.currentSnap)
          .write(path + 'difference.png', function (err2) {
            if (err2) {
              reject(err2);
            }

            resolve(imagesAreSame);
          });
      }.bind(this));
    });

    return promise;
  };

  this.moveSnapshot = ({ path, filename }) => {
    fs.renameSync( this.currentSnap, path + filename );

    return true;
  };

  this.cleanup = () => {
    if ( fileExists( this.currentSnap ) ) {
      fs.unlinkSync( this.currentSnap );
    }

    if ( fileExists( this.currentDiff ) ) {
      fs.unlinkSync( this.currentDiff );
    }
  };

  this.compare = () => {
    var promise = new Promise((resolve) => {
      this.snap( { path: savePath } ).then((differ) => {
        let willHandleUpdate = false;

        if (process.env.UPDATE_SNAPSHOTS || updateSnapshots) {
          willHandleUpdate = true;

          if (typeof process.env.UPDATE_SNAPSHOTS === 'string' &&
              process.env.UPDATE_SNAPSHOTS !== '1' &&
              process.env.UPDATE_SNAPSHOTS !== 'true') {
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
          let created = false;
          if ( !fileExists( savePath + 'theirs-' + componentName + '.png' ) ) {
            differ.moveSnapshot({ path: savePath, filename: 'theirs-' + componentName + '.png' });
            created = true;
          }

          differ.cleanup();
          onSnapshotCreated(created);
        } else {
          differ.compareTo({
            path: savePath,
            filename: 'theirs-' + componentName + '.png'
          }).then((areTheSame) => {
            resolve(areTheSame);
          });
        }
      });
    });

    return promise;
  };
};

export { Differ };
