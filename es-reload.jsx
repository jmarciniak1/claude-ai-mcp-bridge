(function () {
  $.evalFile("D:/MCPs/claude-ai-mcp-bridge/src/extendscript/aftereffects/ae-bridge.jsx");
  var ok = (typeof JSON === "object") && (typeof JSON.stringify === "function") && (typeof JSON.parse === "function");
  var roundtrip = "";
  try { roundtrip = JSON.parse(JSON.stringify({ a: 1, b: "x\"y", c: [true, null, 2.5] })).b; } catch (e) { roundtrip = "ERR:" + e; }
  return "reloaded JSON=" + (typeof JSON) + " stringify=" + (typeof JSON.stringify) +
         " executeCommand=" + (typeof executeCommand) + " roundtrip.b=" + roundtrip;
})();
