const imageExtensions = require('image-extensions');
const textExtensions = require('text-extensions');
const videoExtensions = require('video-extensions');
var exts = Object.create(null);
videoExtensions.forEach(function (el:any) {
	exts[el] = true;
});

var audioExtensions = require('audio-extensions');

function assertPath(path:string) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
  }
}

function extname(path: string) {
  assertPath(path);
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
}

const isImage = (filePath: string)=>{
    const imgExtensions = new Set(imageExtensions);
    if (imgExtensions.has(extname(filePath).slice(1).toLowerCase())) {
      return true;
    }
    return false;
}

const isText = (filePath: string)=>{
 const txtExtensions = new Set(textExtensions);
 if (txtExtensions.has(extname(filePath).slice(1).toLowerCase())) {
    return true;
    }
    return false;
}
const isVideo = (filePath: string)=>{
    const vExtensions = new Set(videoExtensions);
 if (vExtensions.has(extname(filePath).slice(1).toLowerCase())) {
    return true;
}
return false;
}
const isAudio = (filePath: string)=>{
    
 const aExtensions = new Set(audioExtensions);
 if (aExtensions.has(extname(filePath).slice(1).toLowerCase())) {
    return true;
}
return false;
}
 export {
    isImage,
    isText,
    isVideo,
    isAudio
 }
