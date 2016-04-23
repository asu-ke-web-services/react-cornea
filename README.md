React Cornea
============

[![Build Status](https://travis-ci.org/gios-asu/react-cornea.svg?branch=develop)](https://travis-ci.org/gios-asu/react-cornea)

A testing utility for generating visual diffs of your React components.

This tool will create 3 files - `theirs-{componentName}.png`, `yours-{componentName}.png` and `difference.png`. When `differ.cleanup` is called, `yours-{componentName}.png` and `difference.png` will be deleted.

# Installation

```
npm install --save-dev react-cornea
```

This NPM package has a dependency on [ImageMagick](http://www.imagemagick.org/). To install it, see the [ImageMagick documentation](http://www.imagemagick.org/script/binary-releases.php). Installation on some Linux systems, such as Ubuntu is easy:

```sh
sudo apt-get install imagemagick
```

For OSX using Brew:

```sh
brew install ImageMagick
```

Note that when using TravisCI, ImageMagick is already installed.

# Usage

React Cornea provides utility functions for you to test your React components.

Here is an example using Mocha:

```js
import React from 'react';
import {expect} from 'chai';
const {describe, it} = global;
import { Differ } from 'react-cornea';
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
      savePath: __dirname + '/'
    });

    differ.compare().then((areTheSame) => {
      expect(areTheSame).to.equal(true);

      differ.cleanup();

      done();
    });
  });
});

```

For your first set of snapshots, you can use the environment variables to generate snapshots for components that do not yet have snapshots:

```sh
env CREATE_SNAPSHOTS=1 npm test
```

Or by passing in a createSnapshots option:

```js
var differ = new Differ({
  component: <Program program={program} />,
  componentName: 'program',
  savePath: __dirname + '/',
  threshold: 0,
  onSnapshotCreated: done,
  createSnapshots: true
});
```

If you are working on a large visual change, you can force new screenshots to be generated without running assertions by using environment variables in the command line:

```sh
env UPDATE_SNAPSHOTS=1 npm test
```

You can also specify components by name:

```sh
env UPDATE_SNAPSHOTS="my-component" npm test
```

Or by passing in an updateSnapshots option:

```js
var differ = new Differ({
  component: <Program program={program} />,
  componentName: 'program',
  savePath: __dirname + '/',
  threshold: 0,
  onSnapshotUpdated: done,
  updateSnapshots: true
});
```

## Using with your current system

If you are using this utility, use `env CREATE_SNAPSHOTS=1 npm run test` to generate a first, initial set of snaphots (called `theirs-{componentName}.png`). You should check these into your version control.

Then, whenever you run tests `npm run test`, the utility will diff the current version of your component with the `theirs-{componentName}.png` file.

Watch out, it is not very useful to check in the `your-{componentName}.png` or `difference.png`; however, you can if you want ;)

# API

```
new Differ(options) :=> Object{Differ}
```

Create a new Differ object

- options
    - component - The React component you want to test
    - componentName - The name of your component, used to save your file
    - savePath - The folder where your screenshots should be saved
    - threshold - The percentage difference allowed. Defaults to 0
    - css - A CSS string of custom styles you would like injected. Defaults to ''
    - cssFile - The path to a css file to include
    - viewportSize - An object with height and width defined as numbers. Defaults to { width: 1440, height: 900 }
    - onSnapshotUpdated - What to do after screenshots have been updated when using the `env UPDATE_SCREENSHOTS=1` or option `updateScreenshots: true`. Defaults to noop.
    - updateSnapshots - Instead of running tests, simply update snapshots. Defaults to false.
    - onSnapshotCreated - Callback for after a snapshot was created. Calls the callback no matter what, but passes in boolean with true if the snapshot was created, false if one existed and the snapshot was not generated. Defaults to noop.
    - createSnapshots - Instead of running tests, simply create snapshots for components that do not already have snapshots. Defaults to false.


```
compare() :=> Promise
```

Will snap a picture of the your version of the React component, then compare it to the baseline, then generate a difference image. Once complete, the given
Promise will resolve with whether the difference is within the threshold

```
cleanup() :=> nil
```

Will remove `yours-{componentName}.png` and `difference.png`.

## Internal calls

The following are provided, but their interfaces may change in the future:

```
snap(options) :=> Promise
```

Will take a screenshot.

- options
    - path - The path to save the screenshot to


```
compareTo(options) :=> Promise
```

Will compare the screenshots and generate diff, as well as resolve the Promise with whether the images are within the threshold difference.

- options
    - path - Path to save to
    - filename - File to check the currentSnap against

```
moveSnapshot(options) :=> boolean
```

Will attempt to move the snapshot from `yours-{componentName}.png` to `theirs-{componentName}.png`

- options
    - path - Folder to move to
    - filename - Filename to move to


# Development

We have a build script to transpile the ES2015 code to ES2013 code.

```sh
npm run build
```
