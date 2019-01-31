var COLUMNS = "Columns";
var ROWS = "Rows";
var CENTERS = "Use center distance";
var SPACING;

function properties(args) {
  SPACING = `Spacing (${args.preferredUnit})`;

  return [
    {
      type: "range",
      id: COLUMNS,
      value: 2,
      min: 1,
      max: 10,
      step: 1
    },
    {
      type: "range",
      id: ROWS,
      value: 2,
      min: 1,
      max: 10,
      step: 1
    },
    {
      type: "range",
      id: SPACING,
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.001
    },
    {
      type: "boolean",
      id: CENTERS,
      value: false
    }
  ];
}

function shallowCopy(object) {
  var result = {};
  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      result[key] = object[key];
    }
  }

  return result;
}

function offsetLine(shape, dx, dy) {
  var newShape = shallowCopy(shape);

  newShape.point1 = {
    x: shape.point1.x + dx,
    y: shape.point1.y + dy
  }

  newShape.point2 = {
    x: shape.point2.x + dx,
    y: shape.point2.y + dy
  }

  return newShape;
}

function offsetCenteredShape(shape, dx, dy) {
  var newShape = shallowCopy(shape);

  newShape.center = {
    x: shape.center.x + dx,
    y: shape.center.y + dy
  };

  return newShape;
}

function offsetShape(shape, dx, dy) {
  switch (shape.type) {
    case "line":
      return offsetLine(shape, dx, dy);

    default:
      return offsetCenteredShape(shape, dx, dy);
  }
}

function getVolumesByIds(volumes, ids) {
  var selectedVolumes = [];

  for (var i = 0; i < volumes.length; i++) {
    var volume = volumes[i];

    for (var j = 0; j < ids.length; j++) {
      if (volume.id === ids[j]) {
        selectedVolumes.push(volume);
      }
    }
  }

  return selectedVolumes;
}

function getVolumeBounds(volume) {
  switch (volume.shape.type) {
    case "line":
      return {
        x1: Math.min(volume.shape.point1.x, volume.shape.point2.x),
        x2: Math.max(volume.shape.point1.x, volume.shape.point2.x),
        y1: Math.min(volume.shape.point1.y, volume.shape.point2.y),
        y2: Math.max(volume.shape.point1.y, volume.shape.point2.y)
      };

    case "drill":
      return {
        x1: volume.shape.center.x,
        x2: volume.shape.center.x,
        y1: volume.shape.center.y,
        y2: volume.shape.center.y
      };

    default:
      return {
        x1: volume.shape.center.x - (volume.shape.width / 2),
        x2: volume.shape.center.x + (volume.shape.width / 2),
        y1: volume.shape.center.y - (volume.shape.height / 2),
        y2: volume.shape.center.y + (volume.shape.height / 2)
      };
  }
}

function calculateBounds(volumes) {
  var bounds = getVolumeBounds(volumes[0]);

  for (var i = 1; i < volumes.length; i++) {
    var volume = volumes[i];
    var volumeBounds = getVolumeBounds(volumes[i]);

    bounds.x1 = Math.min(bounds.x1, volumeBounds.x1);
    bounds.x2 = Math.max(bounds.x2, volumeBounds.x2);
    bounds.y1 = Math.min(bounds.y1, volumeBounds.y1);
    bounds.y2 = Math.max(bounds.y2, volumeBounds.y2);
  }

  return bounds;
}

function calculateGap(bounds, spacing, useCenters, unit) {
  var unitDivisor = unit === "mm"
    ? 25.4
    : 1.0;

  var gap = {
    x: spacing / unitDivisor,
    y: spacing / unitDivisor
  };

  if (!useCenters) {
    gap.x += bounds.x2 - bounds.x1;
    gap.y += bounds.y2 - bounds.y1;
  }

  return gap;
}

function executor(args, success, failure) {
  var columnCount = args.params[COLUMNS];
  var rowCount = args.params[ROWS];
  var spacing = args.params[SPACING];
  var useCenters = args.params[CENTERS];

  var selectedVolumeIds = args.selectedVolumeIds || []

  if (selectedVolumeIds.length === 0) {
    failure("Select one or more shapes to replicate.");
    return;
  }

  var selectedVolumes = getVolumesByIds(args.volumes, selectedVolumeIds);

  var bounds = calculateBounds(selectedVolumes);
  var gap = calculateGap(bounds, spacing, useCenters, args.preferredUnit);

  var newVolumes = [];

  for (var i = 0; i < selectedVolumes.length; i++) {
    var volume = selectedVolumes[i];

    for (var row = 0; row < rowCount; row++) {
      for (var col = 0; col < columnCount; col++) {
        var dx = gap.x * col;
        var dy = gap.y * row;

        var newVolume = shallowCopy(volume);

        // Setting the volume id to null will cause a new volume to be created
        newVolume.id = null;
        newVolume.shape = offsetShape(volume.shape, dx, dy);

        // Force a replacement of the original, so we don't end up with a double of it.
        if (row === 0 && col === 0) {
          newVolume.id = volume.id;
        }

        newVolumes.push(newVolume);
      }
    }
  }

  success(newVolumes);
}
