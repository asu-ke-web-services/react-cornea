import React from 'react';
import {render} from 'enzyme';
import phantom from 'phantom';
import imageDiff from 'image-diff';
import fs from 'fs';
import fileExists from 'file-exists';
import gm from 'gm';

import { DEVICE_SIZES } from './enums/device-sizes';

let imagemagick = gm.subClass({ imageMagick: true });

const renderHtml = (component, css) => {
  const wrapper = render(component);
  let html = wrapper.html();

  let styles = '<style>' + css + '</style>'; 

  html = '<html><head>' + styles + '</head><body>' + html + '</body></html>'; 

  return html;
}

const createScreenshot = ({ resolve, reject, componentName, html, ref, path, css, viewportSize }) => {
  phantom.create().then((ph) => {
    ph.createPage().then((page) => {
      page.property('viewportSize', viewportSize).then(() => {
        page.property('content', html).then(() => {
          // TODO figure out a better way to do this
          setTimeout(() => {
            let fullFileName = path + 'yours-' + componentName + '.png';
            page.render(fullFileName).then((e) => {
              ph.exit();
              ref.currentSnap = fullFileName;
              resolve(ref);
            });
          }, 1000);
        })
      });
    })
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
    threshold = 0,
    onSnapshotsUpdated = () => {},
    updateSnapshots = false,
    onSnapshotCreated = () => {},
    createSnapshots = false,
}) {
  this.currentSnap = null;
  this.currentDiff = null;
  this.html        = renderHtml(component, css);

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
        imagemagick().command('composite') 
          .in("-gravity", "center")
          .in(path + 'difference.png')
          .in(this.currentSnap)
          .write(path + 'difference.png', function (err) {
            resolve(imagesAreSame);
          });
      }.bind(this));
    });

    return promise;
  }

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
  }

  this.compare = () => {
    var promise = new Promise((resolve, reject) => {
      this.snap( { path: savePath } ).then((differ) => {
        if (process.env.UPDATE_SNAPSHOTS || updateSnapshots) {
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
          differ.compareTo( { path: savePath, filename: 'theirs-' + componentName + '.png' } ).then((areTheSame) => {
            resolve(areTheSame);
          });
        }
      });
    });

    return promise;
  };
};

export { Differ };
