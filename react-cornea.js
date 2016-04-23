import {render} from 'enzyme';
import phantom from 'phantom';
import imageDiff from 'image-diff';
import fs from 'fs';
import fileExists from 'file-exists';
import gm from 'gm';

const DEVICE_SIZES = {
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

export { DEVICE_SIZES };

class Stylesheets {
  constructor() {
    this.css = '';
  }

  addCSS(css) {
    this.css += css;
  }

  addCSSFile(cssFilePath) {
    let css = fs.readFileSync(cssFilePath).toString();
    this.addCSS(css);
  }

  createStyles() {
    return '<style>' + this.createReset() + this.css + '</style>';
  }

  createReset() {
    let reset = `
/* http://meyerweb.com/eric/tools/css/reset/
   v2.0 | 20110126
   License: none (public domain)
*/

html, body, div, span, applet, object, iframe,
h1, h2, h3, h4, h5, h6, p, blockquote, pre,
a, abbr, acronym, address, big, cite, code,
del, dfn, em, img, ins, kbd, q, s, samp,
small, strike, strong, sub, sup, tt, var,
b, u, i, center,
dl, dt, dd, ol, ul, li,
fieldset, form, label, legend,
table, caption, tbody, tfoot, thead, tr, th, td,
article, aside, canvas, details, embed,
figure, figcaption, footer, header, hgroup,
menu, nav, output, ruby, section, summary,
time, mark, audio, video {
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 100%;
    font: inherit;
    vertical-align: baseline;
}
/* HTML5 display-role reset for older browsers */
article, aside, details, figcaption, figure,
footer, header, hgroup, menu, nav, section {
    display: block;
}
body {
    line-height: 1;
}
ol, ul {
    list-style: none;
}
blockquote, q {
    quotes: none;
}
blockquote:before, blockquote:after,
q:before, q:after {
    content: '';
    content: none;
}
table {
    border-collapse: collapse;
    border-spacing: 0;
}
`;
    return reset;
  }
}

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
