React Cortex
============

A testing utility for generating visual diffs of your React components.

# Installation

```
npm install --save-dev react-cortex
```

This NPM package has a dependency on [ImageMagick](http://www.imagemagick.org/). To install it, see the [ImageMagick documentation](http://www.imagemagick.org/script/binary-releases.php). Installation on some Linux systems, such as Ubuntu is easy:

```
sudo apt-get install imagemagick
```

Note that when using TravisCI, ImageMagick is already installed.

# Usage

React Cortex provides utility functions for you to test your React components.

Here is an example using Mocha:

```js
import React from 'react';
import {expect} from 'chai';
const {describe, it} = global;
import { Differ } from 'react-cortex';
import { default as Program } from '../program.jsx';

describe('A Program Component', () => {
  const componentName = 'program';
  const program = {
    name: 'Save the whale'
  };

  it( 'has not visually changed', (done) => {
    var differ = new Differ({
      component: <Program program={program} />,
      componentName: 'program',
      savePath: __dirname + '/',
      threshold: 0,
      onScreenshotsUpdated: done // Used when updating screenshots
    });

    differ.compare().then((areTheSame) => {
      expect(areTheSame).to.equal(true);

      differ.cleanup();

      done();
    });
  });
});

```

If you are working on a large visual change, you can force new screenshots to be generated without running assertions by using environment variables in the command line:

```sh
env UPDATE_SNAPSHOTS=1 npm run testonly
```

Or by passing in an updateSnapshots option:

```js
var differ = new Differ({
  component: <Program program={program} />,
  componentName: 'program',
  savePath: __dirname + '/',
  threshold: 0,
  done, // Used when updating screenshots
  updateSnapshots: true
});
```

# Development

We have a build script to transpile the ES2015 code to ES2013 code.

```sh
npm run build
```
