import React from 'react';
import fileExists from 'file-exists';
import fs from 'fs';

import { expect } from 'chai';
const { describe, it } = global;

import { Differ } from '../react-cornea';

import { default as ReactFixture } from './fixtures/react-fixture.jsx';

describe( 'Differ', () => {

  const componentName = 'fixture';
  const theirFilePath = __dirname + '/fixtures/theirs-fixture.png';
  const yourFilePath = __dirname + '/fixtures/yours-fixture.png';
  const diffFilePath = __dirname + '/fixtures/difference.png';
  const name = 'Differ Test';
  const description = 'Making sure we can detect changes';

  describe( 'React Snapshots', () => {

    /**
     * Generate a snapshot and check that it
     * exists
     */
    it( 'can generate snapshot', function ( done ) {
      this.timeout( 10000 );

      const onScreenshotsUpdated = () => {
        expect( fileExists( theirFilePath ) ).to.equal( true );

        done();
      };

      const differ = new Differ( {
        component: <ReactFixture name={name} description={description} />,
        componentName,
        savePath: __dirname + '/fixtures/',
        updateSnapshots: true,
        onScreenshotsUpdated
      } );

      differ.compare();
    } );

    /**
     * Generate a snapshot and check that another
     * snapshot matches it
     */
    it( 'can compare snapshots', function ( done ) {
      this.timeout( 10000 );

      const onScreenshotsUpdated = () => {
        const anotherDiffer = new Differ( {
          component: <ReactFixture name={name} description={description} />,
          componentName,
          savePath: __dirname + '/fixtures/'
        } );

        anotherDiffer.compare().then( ( areTheSame ) => {
          expect( fileExists( theirFilePath ) ).to.equal( true );
          expect( fileExists( yourFilePath ) ).to.equal( true );
          expect( fileExists( diffFilePath ) ).to.equal( true );

          expect( areTheSame ).to.equal( true );

          done();
        } );
      };

      const differ = new Differ( {
        component: <ReactFixture name={name} description={description} />,
        componentName,
        savePath: __dirname + '/fixtures/',
        updateSnapshots: true,
        onScreenshotsUpdated
      } );

      differ.compare();
    } );

    /**
     * Can clean up after generating snapshots
     */
    it( 'can cleanup snapshots', function ( done ) {
      this.timeout( 10000 );

      const onScreenshotsUpdated = () => {
        const anotherDiffer = new Differ( {
          component: <ReactFixture name={name} description={description} />,
          componentName,
          savePath: __dirname + '/fixtures/'
        } );

        anotherDiffer.compare().then( ( areTheSame ) => {
          expect( fileExists( theirFilePath ) ).to.equal( true );
          expect( fileExists( yourFilePath ) ).to.equal( true );
          expect( fileExists( diffFilePath ) ).to.equal( true );

          anotherDiffer.cleanup();

          expect( fileExists( theirFilePath ) ).to.equal( true );
          expect( fileExists( yourFilePath ) ).to.equal( false );
          expect( fileExists( diffFilePath ) ).to.equal( false );

          done();
        } );
      };

      const differ = new Differ( {
        component: <ReactFixture name={name} description={description} />,
        componentName,
        savePath: __dirname + '/fixtures/',
        updateSnapshots: true,
        onScreenshotsUpdated
      } );

      differ.compare();
    } );

    after( function ( done ) {
      // Clean up
      if ( fileExists( theirFilePath ) ) {
        fs.unlinkSync( theirFilePath );
      }

      done();
    } );

  } );

} );
