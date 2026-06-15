(function () {
  var target = null;
  for (var i = 1; i <= app.project.numItems; i++) {
    var it = app.project.item(i);
    if (it instanceof FootageItem && it.name.indexOf("01-ai-vision-pipeline") !== -1) { target = it; break; }
  }
  if (!target) return "ERR: SVG footage item not found";
  var path = (target.mainSource && target.mainSource.file) ? target.mainSource.file.fsName : "(no file)";
  app.beginUndoGroup("Reload SVG footage");
  try {
    target.mainSource.reload();
  } catch (e) {
    app.endUndoGroup();
    return "ERR reload: " + e.toString() + " | file=" + path;
  }
  app.endUndoGroup();
  return "OK reloaded: " + target.name + " | file=" + path + " | size=" + target.width + "x" + target.height;
})();
