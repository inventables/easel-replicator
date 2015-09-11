    // Define a properties array that returns array of objects representing
    // the accepted properties for your application
    var properties = [
      {type: 'range', id: 'Columns', value: 2, min: 1, max: 10, step: 1},
      {type: 'range', id: 'Rows', value: 2, min: 1, max: 10, step: 1},
    ];

    // flip a point vertically to the SVG coordinate system where +Y is down
    var flipPointY = function(point) {
      return [point[0], -point[1]];
    };

    var flipPointArraysY = function(pointArrays) {
      return pointArrays.map(function(pointArray) {
        return pointArray.map(flipPointY);
      });
    };

    var offsetPoint = function(point, dx, dy) {
      return [point[0] + dx, point[1] + dy];
    };

    var offsetPointArrays = function(pointArrays, dx, dy) {
      return pointArrays.map(function(pointArray) {
        return pointArray.map(function(point) {
          return offsetPoint(point, dx, dy);
        });
      });
    };

    var pathSvgDataForPointArray = function(pointArray) {
      return 'M' + pointArray.map(function(point) { return point[0] + ',' + point[1]; }).join(' ');
    };

    var pathSvgForPointArrays = function(pointArrays) {
      return '<path d="' + pointArrays.map(pathSvgDataForPointArray).join(' ') + '" />';
    };

    // Define an executor function that generates a valid SVG document string,
    // and passes it to the provided success callback, or invokes the failure
    // callback if unable to do so
    var executor = function(args, success, failure) {
      var params = args[0];
      var columnCount = params['Columns'];
      var rowCount = params['Rows'];
      var shapeProperties = args[1];
      var shapeWidth = shapeProperties.right - shapeProperties.left;
      var shapeHeight = shapeProperties.top - shapeProperties.bottom;
      var pointArrays = flipPointArraysY(offsetPointArrays(shapeProperties.pointArrays, -shapeProperties.left, -shapeProperties.top));
      var resultPointArrays = [];
      for (var y = 0; y < rowCount; y++) {
        for (var x = 0; x < columnCount; x++) {
          resultPointArrays.push(offsetPointArrays(pointArrays, x * shapeWidth, y * shapeHeight));
        }
      }
      var svgWidth = columnCount * shapeWidth * 96;
      var svgHeight = rowCount * shapeHeight * 96;
      var viewBox = [0, 0, columnCount * shapeWidth, rowCount * shapeHeight].join(' ');
      var svg = [
        '<?xml version="1.0" standalone="no"?>',
        '<svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="' + svgWidth + '" height="' + svgHeight + '" viewBox="' + viewBox + '">',
        resultPointArrays.map(pathSvgForPointArrays).join(''),
        '</svg>'
      ].join('');

      success(svg);
    };

