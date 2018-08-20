// Define an array named `properties` with objects representing
// the user-adjustable inputs to your application
var properties = [
  {type: 'range', id: 'Columns', value: 2, min: 1, max: 10, step: 1},
  {type: 'range', id: 'Rows', value: 2, min: 1, max: 10, step: 1},
  {type: 'range', id: 'Spacing (in)', value: 0.5, min: 0, max: 1, step: 0.001},
];

var shallowCopy = function(object) {
  var result = {};
  for (var nextKey in object) {
    if (object.hasOwnProperty(nextKey)) {
      result[nextKey] = object[nextKey];
    }
  }

  return result;
};

var offsetLineShape = function(shape, dx, dy) {
  shape.point1 = {
    x: shape.point1.x + dx,
    y: shape.point1.y + dy
  }

  shape.point2 = {
    x: shape.point2.x + dx,
    y: shape.point2.y + dy
  }

  return shape;
}

var offsetAnyShapeThatIsNotALine = function(shape, dx, dy) {
  shape.center = {
    x: shape.center.x + dx,
    y: shape.center.y + dy
  };

  return shape;
}

var offsetVolume = function(volume, spacing, x, y) {
  var newVolume = shallowCopy(volume);
  var width = volume.shape.width || 0;
  var height = volume.shape.height || 0;

  newVolume.id = null;
  newVolume.shape = shallowCopy(volume.shape);

  if (newVolume.shape.tpye === 'line') {
    newVolume.shape.rotation = null
  } else {
    newVolume.shape.rotation = newVolume.shape.rotation
  }

  newVolume.shape.rotation = newVolume.shape.rotation
  newVolume.shape.flipping = newVolume.shape.flipping

  var dx = (height + spacing) * x,
      dy = (width + spacing) * y

  if (newVolume.shape.type === 'line') {
    newVolume.shape = offsetLineShape(newVolume.shape, dx, dy)
  } else {
    newVolume.shape = offsetAnyShapeThatIsNotALine(newVolume.shape, dx, dy)
  }

  return newVolume;
}

var getVolumeById = function(volumes, id) {
  for (var i = 0; i < volumes.length; i++) {
    if (volumes[i].id === id) {
      return volumes[i]
    }
  }
}

// Define a function named `executor` that generates a valid SVG document string
// and passes it to the provided success callback, or invokes the failure
// callback if unable to do so
var executor = function(args, success, failure) {
  var params = args.params;
  var columnCount = params['Columns'];
  var rowCount = params['Rows'];
  var spacing = params['Spacing (in)'];

  var selectedVolumeIds = args.selectedVolumeIds || []

  if (selectedVolumeIds.length != 1) {
    failure('A single volume must be selected!');
    return;
  }

  var selectedVolume = getVolumeById(args.volumes, selectedVolumeIds[0]);
  var newVolumes = [];
  for (var y = 0; y < rowCount; y++) {
    for (var x = 0; x < columnCount; x++) {
      newVolumes.push(offsetVolume(selectedVolume, spacing, x, y))
    }
  }
  success(newVolumes);
};
