(function () {
  function findComp(name){ for (var i=1;i<=app.project.numItems;i++){ var it=app.project.item(i); if (it instanceof CompItem && it.name===name) return it;} return null; }
  var comp = findComp("01-ai-vision-pipeline") || app.project.activeItem;
  if (!comp || !(comp instanceof CompItem)) return "ERR: no comp";
  var layer = null;
  for (var li=1; li<=comp.numLayers; li++){ if (comp.layer(li).name.indexOf(".svg")!==-1){ layer=comp.layer(li); break; } }
  if (!layer) return "ERR: no svg layer";

  app.beginUndoGroup("Claude: box-aligned reveal + reframe");

  // --- Reframe: 90% scale, centered, so the diagram has margins in the frame ---
  var fw = layer.width, fh = layer.height;
  layer.transform.anchorPoint.setValue([fw/2, fh/2]);
  layer.transform.position.setValue([comp.width/2, comp.height/2]);
  layer.transform.scale.setValue([90,90]);

  // --- Linear Wipe completion ---
  var fx = layer.property("ADBE Effect Parade");
  var wipe = fx.property("ADBE Linear Wipe");
  if (!wipe) { app.endUndoGroup(); return "ERR: Linear Wipe not found"; }
  var prop = wipe.property("ADBE Linear Wipe-0001"); // Transition Completion

  while (prop.numKeys > 0) prop.removeKey(1);

  // Hold values aligned to each box's right edge (+~20px) -> box fully shown, then slow.
  // Holds extended so each section's (now ~3s) icon highlight(s) finish before the next wipe.
  var times = [0, 0.80, 6.60, 7.40, 10.80, 11.60, 15.00, 15.80, 19.20, 20.00, 23.40, 24.20];
  var vals  = [100, 79.2, 79.2, 63.6, 63.6, 46.6, 46.6, 27.3, 27.3, 13.8, 13.8, 0];
  for (var k=0;k<times.length;k++) prop.setValueAtTime(times[k], vals[k]);

  // Easing: strong deceleration arriving at each box-complete keyframe (even idx),
  // gentle acceleration leaving each hold (odd idx).
  for (var i=1;i<=prop.numKeys;i++){
    prop.setInterpolationTypeAtKey(i, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
    var isEdge = (i % 2 === 0);
    var ein  = isEdge ? new KeyframeEase(0,80) : new KeyframeEase(0,33);
    var eout = new KeyframeEase(0,33);
    prop.setTemporalEaseAtKey(i, [ein], [eout]);
  }

  comp.workAreaStart = 0;
  comp.workAreaDuration = Math.min(comp.duration, 27.6);

  app.endUndoGroup();

  var rep = "OK scale=90% centered keys=" + prop.numKeys + " | ";
  for (var r=1;r<=prop.numKeys;r++) rep += prop.keyTime(r).toFixed(2)+"s="+prop.keyValue(r).toFixed(1)+"% ";
  return rep;
})();
