import React from 'react';

import { expect } from 'chai';
const { describe, it } = global;

import { default as Stylesheets } from '../stylesheets/stylesheets';

describe( 'Stylesheets', () => {
  let stylesheet;
  const css = '.test { color: black; }';
  const cssFilePath = __dirname + '/fixtures/css-fixture.css';

  beforeEach( () => {
    stylesheet = new Stylesheets();
  } );

  it( 'will include the given CSS', () => {
    stylesheet.addCSS(css);

    let styles = stylesheet.createStyles();

    expect(styles).to.contain(css);
  } );

  it ( 'will include the given CSS file', () => {
    stylesheet.addCSSFile(cssFilePath);

    let styles = stylesheet.createStyles();

    expect(styles).to.contain('.container');
    expect(styles).to.contain('.name');
    expect(styles).to.contain('.description');
  } );
} );
