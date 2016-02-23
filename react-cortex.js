import React from 'react';
import {render} from 'enzyme';
import phantom from 'phantom';
import imageDiff from 'image-diff';
import fs from 'fs';
import fileExists from 'file-exists';

const renderHtml = (component) => {
  const wrapper = render(component);
  let html = wrapper.html();
  html = '<html><body>' + html + '</body></html>'; 

  return html;
}

const createScreenshot = ({ resolve, reject, componentName, html, ref, path }) => {
  phantom.create().then((ph) => {
    ph.createPage().then((page) => {
      page.property('viewportSize', {
        width: 1440,
        height: 900
      }).then(() => {
        page.property('content', html).then(() => {
          // TODO figure out a better way to do this
          setTimeout(() => {
            let fullFileName = path + 'latest-' + componentName + '.png';
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

// TODO support multiple viewport sizes
// TODO support stylesheet injection
const Differ = function ({
    componentName, component, savePath, threshold = 0, onScreenshotsUpdated = ()=>{}, updateSnapshots = false
}) {
  this.currentSnap = null;
  this.currentDiff = null;
  this.html        = renderHtml(component);

  this.snap = ({ path = './' }) => {
    let promise = new Promise((resolve, reject) => {
      createScreenshot({
        resolve, reject, componentName, html: this.html, path,
        ref: this
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
        resolve(imagesAreSame);
      });
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
        differ.compareTo( { path: savePath, filename: componentName + '.png' } ).then((areTheSame) => {
          if (process.env.UPDATE_SNAPSHOTS || updateSnapshots) {
            differ.moveSnapshot({ path: savePath, filename: componentName + '.png' });
            differ.cleanup();
            onScreenshotsUpdated();
          } else {
            resolve(areTheSame);
          }
        });
      });
    });

    return promise;
  };
};

export { Differ };
