(function(){
  function findComp(n){for(var i=1;i<=app.project.numItems;i++){var it=app.project.item(i); if(it instanceof CompItem&&it.name===n)return it;}return null;}
  var comp=findComp("01-ai-vision-pipeline")||app.project.activeItem;
  if(!comp||!(comp instanceof CompItem)) return "ERR: no comp";

  app.beginUndoGroup("Claude: subtle gold blips + control layer");

  // Idempotent: clear prior blip layers and any old control layer.
  for (var i=comp.numLayers;i>=1;i--){ var ly=comp.layer(i); if (ly.name.indexOf("Blip_")===0 || ly.name==="BLIP CONTROL") ly.remove(); }

  // SVG footage layer -> mapping (with -29 comp-Y calibration for AE's SVG raster offset)
  var svg=null; for (var s=1;s<=comp.numLayers;s++){ if(comp.layer(s).name.indexOf(".svg")!==-1){svg=comp.layer(s);break;} }
  if(!svg) return "ERR: no svg layer";
  var sc=svg.transform.scale.value[0]/100, pos=svg.transform.position.value, anc=svg.transform.anchorPoint.value;
  var XOFF=0, YOFF=-26;
  function toComp(lx,ly){ return [ pos[0]+(lx-anc[0])*sc+XOFF, pos[1]+(ly-anc[1])*sc+YOFF ]; }

  // ---- Central control layer ----
  var ctrl=comp.layers.addNull(comp.duration);
  ctrl.name="BLIP CONTROL";
  ctrl.label=11;
  var fxp=ctrl.property("ADBE Effect Parade");
  function slider(nm,val){ var e=fxp.addProperty("ADBE Slider Control"); e.name=nm; e.property(1).setValue(val); return e; }
  slider("Global Offset",0);   // shift ALL blips in time (seconds)
  slider("Intensity",40);      // peak opacity % (subtlety)
  slider("Duration",3.0);      // base highlight length (seconds)
  var mk=ctrl.property("ADBE Marker");

  // name, SVG chip-center x, y, marker time, extra duration (sources held a touch longer)
  var icons=[
    ["GIS",   69, 120, 0.90, 0.2],
    ["EPA",   69, 210, 2.00, 0.2],
    ["Labor", 69, 300, 3.10, 0.2],
    ["AIV",  365, 120, 7.50, 0.0],
    ["DET",  612, 120,11.70, 0.0],
    ["ENR",  889, 210,15.90, 0.0],
    ["RANK",1178, 210,20.10, 0.0],
    ["OUT", 1389, 210,24.30, 0.0]
  ];
  for (var m=0;m<icons.length;m++){ mk.setValueAtTime(icons[m][3], new MarkerValue(icons[m][0])); }

  function expr(nm,extra){
    return 'var c=thisComp.layer("BLIP CONTROL");\n'+
           'var off=c.effect("Global Offset")("Slider");\n'+
           'var pk=c.effect("Intensity")("Slider");\n'+
           'var dur=c.effect("Duration")("Slider")+'+extra+';\n'+
           'var nm="'+nm+'"; var t0=0; var f=false;\n'+
           'for(var i=1;i<=c.marker.numKeys;i++){ if(c.marker.key(i).comment==nm){ t0=c.marker.key(i).time; f=true; break; } }\n'+
           'var lt=time-(t0+off); var o=0;\n'+
           'if(f && lt>=0 && lt<=dur){ o=Math.min(linear(lt,0,0.5,0,pk), linear(lt,dur-0.8,dur,pk,0)); }\n'+
           'o';
  }

  for (var j=0;j<icons.length;j++){
    var nm=icons[j][0], p=toComp(icons[j][1],icons[j][2]), extra=icons[j][4];
    var sh=comp.layers.addShape(); sh.name="Blip_"+nm;
    var cont=sh.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    var r=cont.addProperty("ADBE Vector Shape - Rect");
    r.property("ADBE Vector Rect Size").setValue([29,29]);   // fit within the ~30.6px chip
    r.property("ADBE Vector Rect Position").setValue([0,0]);
    r.property("ADBE Vector Rect Roundness").setValue(7.5);
    var fill=cont.addProperty("ADBE Vector Graphic - Fill");
    fill.property("ADBE Vector Fill Color").setValue([1.0,0.80,0.27]);
    var blur=sh.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
    blur.property("ADBE Gaussian Blur 2-0001").setValue(1.2);
    sh.blendingMode=BlendingMode.SCREEN;
    sh.transform.anchorPoint.setValue([0,0]);
    sh.transform.position.setValue(p);
    sh.transform.opacity.expression=expr(nm,extra);
    sh.shy=true;
  }

  ctrl.moveToBeginning();      // keep the control layer at the top of the timeline
  comp.hideShyLayers=true;     // hide the shy blip layers from the timeline panel

  // count visible (non-shy) layers
  var vis=0; for (var v=1;v<=comp.numLayers;v++){ if(!comp.layer(v).shy) vis++; }
  app.endUndoGroup();
  return "OK blips=8 (shy) visibleLayers="+vis+" totalLayers="+comp.numLayers+" hideShy="+comp.hideShyLayers;
})();
