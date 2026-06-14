(function () {
  function findComp(name) {
    for (var i = 1; i <= app.project.numItems; i++) {
      var it = app.project.item(i);
      if (it instanceof CompItem && it.name === name) return it;
    }
    return null;
  }
  var comp = findComp("01-ai-vision-pipeline");
  if (!comp) comp = app.project.activeItem;
  if (!comp || !(comp instanceof CompItem)) return "ERR: no comp";
  var layer = comp.layer(1);
  if (!layer) return "ERR: no layer 1";

  app.beginUndoGroup("Claude: 6-section left-to-right reveal");

  // Idempotent — strip any prior Linear Wipe so re-runs don't stack effects.
  var fx = layer.property("ADBE Effect Parade");
  for (var e = fx.numProperties; e >= 1; e--) {
    var ex = fx.property(e);
    if (ex && ex.matchName === "ADBE Linear Wipe") ex.remove();
  }

  var wipe = fx.addProperty("ADBE Linear Wipe");
  var pComplete = wipe.property("ADBE Linear Wipe-0001"); // Transition Completion
  var pAngle    = wipe.property("ADBE Linear Wipe-0002"); // Wipe Angle
  var pFeather  = wipe.property("ADBE Linear Wipe-0003"); // Feather

  // Wipe Angle -90 => as completion goes 100->0 the image is uncovered
  // starting at the LEFT edge and sweeping right (left-to-right reveal).
  pAngle.setValue(-90);
  pFeather.setValue(8);

  var SECTIONS = 6;
  var REVEAL = 0.9;   // seconds to reveal one section (eased)
  var HOLD   = 0.45;  // seconds paused between sections

  var times = [];
  var vals = [];
  for (var s = 1; s <= SECTIONS; s++) {
    var startT = (s - 1) * (REVEAL + HOLD);
    var endT = startT + REVEAL;
    times.push(startT); vals.push(100 * (SECTIONS - (s - 1)) / SECTIONS);
    times.push(endT);   vals.push(100 * (SECTIONS - s) / SECTIONS);
  }
  for (var k = 0; k < times.length; k++) {
    pComplete.setValueAtTime(times[k], vals[k]);
  }

  // Easy-ease every keyframe: slow start (ease in), slow finish (decelerate)
  // for each section, with flat holds in between.
  var nk = pComplete.numKeys;
  for (var ki = 1; ki <= nk; ki++) {
    pComplete.setInterpolationTypeAtKey(ki, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
    pComplete.setTemporalEaseAtKey(ki, [new KeyframeEase(0, 40)], [new KeyframeEase(0, 40)]);
  }

  // Frame the reveal in the work area for easy preview.
  comp.workAreaStart = 0;
  comp.workAreaDuration = Math.min(comp.duration, (SECTIONS - 1) * (REVEAL + HOLD) + REVEAL + 0.5);

  app.endUndoGroup();

  var rep = "OK comp=" + comp.name + " layer=" + layer.name +
            " angle=" + pAngle.value + " feather=" + pFeather.value +
            " keys=" + pComplete.numKeys + " | ";
  for (var r = 1; r <= pComplete.numKeys; r++) {
    rep += pComplete.keyTime(r).toFixed(2) + "s=" + pComplete.keyValue(r).toFixed(1) + "% ";
  }
  return rep;
})();
