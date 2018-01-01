"use strict";

var path = require( 'path' )
var gulp = require( 'gulp' )

var paths = {
  dest: './lib',
  gql: "src/graphql/*.gql"
}

gulp.task('gql', function () {
  return gulp.src(paths.gql)
    .pipe(gulp.dest(paths.dest + '/graphql' ));
});

gulp.task( 'watch-gql', function () {
  gulp.watch( paths.gql, [ 'gql' ] )
} )

gulp.task( 'default', [ 'watch-gql' ] )

