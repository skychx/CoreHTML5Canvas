/*
 * Copyright (C) 2012 David Geary. This code is from the book
 * Core HTML5 Canvas, published by Prentice-Hall in 2012.
 *
 * License:
 *
 * Permission is hereby granted, free of charge, to any person 
 * obtaining a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * The Software may not be used to create training material of any sort,
 * including courses, books, instructional videos, presentations, etc.
 * without the express written consent of David Geary.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
*/

var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    eraseAllButton = document.getElementById('eraseAllButton'),
    strokeStyleSelect = document.getElementById('strokeStyleSelect'),
    startAngleSelect = document.getElementById('startAngleSelect'),

    fillStyleSelect = document.getElementById('fillStyleSelect'),
    fillCheckbox = document.getElementById('fillCheckbox'),
    editCheckbox = document.getElementById('editCheckbox'),

    sidesSelect = document.getElementById('sidesSelect'),

    CENTROID_RADIUS = 10,
    CENTROID_STROKE_STYLE = 'rgba(0, 0, 0, 0.8)',
    CENTROID_FILL_STYLE ='rgba(255, 255, 255, 0.2)',
    CENTROID_SHADOW_COLOR = 'rgba(255, 255, 255, 0.4)',

    DEGREE_RING_MARGIN = 35,
    TRACKING_RING_MARGIN = 55,
    DEGREE_ANNOTATIONS_FILL_STYLE = 'rgba(0, 0, 230, 0.8)',
    DEGREE_ANNOTATIONS_TEXT_SIZE = 11,
    DEGREE_OUTER_RING_MARGIN = DEGREE_RING_MARGIN,
    TICK_WIDTH = 10,
    TICK_LONG_STROKE_STYLE = 'rgba(100, 140, 230, 0.9)',
    TICK_SHORT_STROKE_STYLE = 'rgba(100, 140, 230, 0.7)',

    TRACKING_RING_STROKING_STYLE = 'rgba(100, 140, 230, 0.3)',
    drawingSurfaceImageData,
   
    mousedown = {},
    rubberbandRect = {},

    dragging = false,
    draggingOffsetX,
    draggingOffsetY,

    sides = 8,
    startAngle = 0,

    guidewires = true,

    editing = false,
    rotatingLockEngaged = false,
    rotatingLockAngle,
    polygonRotating,

    polygons = [];

// Functions.....................................................

function drawGrid(color, stepx, stepy) {
   context.save()

   context.shadowColor = undefined;
   context.shadowBlur = 0;
   context.shadowOffsetX = 0;
   context.shadowOffsetY = 0;
   
   context.strokeStyle = color;
   context.fillStyle = '#ffffff';
   context.lineWidth = 0.5;
   context.fillRect(0, 0, context.canvas.width, context.canvas.height);

   for (var i = stepx + 0.5; i < context.canvas.width; i += stepx) {
     context.beginPath();
     context.moveTo(i, 0);
     context.lineTo(i, context.canvas.height);
     context.stroke();
   }

   for (var i = stepy + 0.5; i < context.canvas.height; i += stepy) {
     context.beginPath();
     context.moveTo(0, i);
     context.lineTo(context.canvas.width, i);
     context.stroke();
   }

   context.restore();
}

function windowToCanvas(e) {
   var x = e.x || e.clientX,
       y = e.y || e.clientY,
       bbox = canvas.getBoundingClientRect();

   return { x: x - bbox.left * (canvas.width  / bbox.width),
            y: y - bbox.top  * (canvas.height / bbox.height)
          };
}

// Save and restore drawing surface..............................

function saveDrawingSurface() {
   drawingSurfaceImageData = context.getImageData(0, 0,
                             canvas.width,
                             canvas.height);
}

function restoreDrawingSurface() {
   context.putImageData(drawingSurfaceImageData, 0, 0);
}


// Rubberbands...................................................

function updateRubberbandRectangle(loc) {
   rubberbandRect.width = Math.abs(loc.x - mousedown.x);
   rubberbandRect.height = Math.abs(loc.y - mousedown.y);

   if (loc.x > mousedown.x) rubberbandRect.left = mousedown.x;
   else                     rubberbandRect.left = loc.x;

   if (loc.y > mousedown.y) rubberbandRect.top = mousedown.y;
   else                     rubberbandRect.top = loc.y;
} 

function drawRubberbandShape(loc, sides, startAngle) {
   var polygon = new Polygon(mousedown.x, mousedown.y,
                     rubberbandRect.width, 
                     parseInt(sidesSelect.value),
                     (Math.PI / 180) * parseInt(startAngleSelect.value),
                     context.strokeStyle,
                     context.fillStyle,
                     fillCheckbox.checked);
   drawPolygon(polygon);
   
   if (!dragging) {
      polygons.push(polygon);
   }
}

function updateRubberband(loc, sides, startAngle) {
   updateRubberbandRectangle(loc);
   drawRubberbandShape(loc, sides, startAngle);
}

// Guidewires....................................................

function drawHorizontalLine (y) {
   context.beginPath();
   context.moveTo(0,y+0.5);
   context.lineTo(context.canvas.width,y+0.5);
   context.stroke();
}

function drawVerticalLine (x) {
   context.beginPath();
   context.moveTo(x+0.5,0);
   context.lineTo(x+0.5,context.canvas.height);
   context.stroke();
}

function drawGuidewires(x, y) {
   context.save();
   context.strokeStyle = 'rgba(0,0,230,0.4)';
   context.lineWidth = 0.5;
   drawVerticalLine(x);
   drawHorizontalLine(y);
   context.restore();
}

// Drawing functions.............................................

function drawPolygons() {
   polygons.forEach( function (polygon) {
      polygon.stroke(context);
      if (polygon.filled) {
         polygon.fill(context);
      }
   });
}

function drawCentroid(polygon) {
   context.beginPath();
   context.save();
   context.strokeStyle = CENTROID_STROKE_STYLE;
   context.fillStyle = CENTROID_FILL_STYLE;
   context.shadowColor = CENTROID_SHADOW_COLOR;
   context.arc(polygon.x, polygon.y, CENTROID_RADIUS, 0, Math.PI*2, false);
   context.stroke();
   context.fill();
   context.restore();
}

function drawCentroidGuidewire(loc, polygon) {
   var angle = Math.atan( (loc.y - polygon.y) / (loc.x - polygon.x) ),
       radius, endpt;

  radius = polygon.radius + TRACKING_RING_MARGIN;
  angle = angle - rotatingLockAngle;

  if (loc.x >= polygon.x) {
      endpt = { x: polygon.x + radius * Math.cos(angle),
                y: polygon.y + radius * Math.sin(angle)
      };
   }
   else {
      endpt = { x: polygon.x - radius * Math.cos(angle),
                y: polygon.y - radius * Math.sin(angle)
      };
   }
   
   context.save();
   context.beginPath();
   context.moveTo(polygon.x, polygon.y);
   context.lineTo(endpt.x, endpt.y);
   context.stroke();

   context.beginPath();
   context.arc(endpt.x, endpt.y, 5, 0, Math.PI*2, false);
   context.stroke();
   context.fill();

   context.restore();
}

function drawDegreeOuterDial(polygon) {
   context.strokeStyle = 'rgba(0, 0, 0, 0.1)';
   context.arc(polygon.x, polygon.y,
               polygon.radius + DEGREE_OUTER_RING_MARGIN,
               0, Math.PI*2, true);
}

function drawDegreeAnnotations(polygon) {
   var radius = polygon.radius + DEGREE_RING_MARGIN;

   context.save();
   context.fillStyle = DEGREE_ANNOTATIONS_FILL_STYLE;
   context.font = DEGREE_ANNOTATIONS_TEXT_SIZE + 'px Helvetica'; 
   
   for (var angle=0; angle < 2*Math.PI; angle += Math.PI/8) {
      context.beginPath();
      context.fillText((angle * 180 / Math.PI).toFixed(0),
         polygon.x + Math.cos(angle) * (radius - TICK_WIDTH*2),
         polygon.y + Math.sin(angle) * (radius - TICK_WIDTH*2));
   }
   context.restore();
}
   
function drawDegreeDialTicks(polygon) {
   var radius = polygon.radius + DEGREE_RING_MARGIN,
       ANGLE_MAX = 2*Math.PI,
       ANGLE_DELTA = Math.PI/64;

   context.save();
   
   for (var angle = 0, cnt = 0; angle < ANGLE_MAX; angle += ANGLE_DELTA, ++cnt) {
      context.beginPath();

      if (cnt % 4 === 0) {
         context.moveTo(polygon.x + Math.cos(angle) * (radius - TICK_WIDTH),
                        polygon.y + Math.sin(angle) * (radius - TICK_WIDTH));
         context.lineTo(polygon.x + Math.cos(angle) * (radius),
                        polygon.y + Math.sin(angle) * (radius));
         context.strokeStyle = TICK_LONG_STROKE_STYLE;
         context.stroke();
      }
      else {
         context.moveTo(polygon.x + Math.cos(angle) * (radius - TICK_WIDTH/2),
                        polygon.y + Math.sin(angle) * (radius - TICK_WIDTH/2));
         context.lineTo(polygon.x + Math.cos(angle) * (radius),
                        polygon.y + Math.sin(angle) * (radius));
         context.strokeStyle = TICK_SHORT_STROKE_STYLE;
         context.stroke();
      }

      context.restore();
   }
}

function drawDegreeTickDial(polygon) {
   context.save();
   context.strokeStyle = 'rgba(0, 0, 0, 0.1)';
   context.beginPath();
   context.arc(polygon.x, polygon.y, polygon.radius + DEGREE_RING_MARGIN - TICK_WIDTH, 0, Math.PI*2, false);
   context.stroke();
   context.restore();
}

function drawTrackingDial(polygon) {
   context.save();
   context.shadowColor = 'rgba(0, 0, 0, 0.7)';
   context.shadowOffsetX = 3,
   context.shadowOffsetY = 3,
   context.shadowBlur = 6,
   context.strokeStyle = TRACKING_RING_STROKING_STYLE;
   context.beginPath();
   context.arc(polygon.x, polygon.y, polygon.radius +
               TRACKING_RING_MARGIN, 0, Math.PI*2, false);
   context.stroke();
   context.restore();
}

function drawRotationAnnotations(loc) {
   drawCentroid(polygonRotating);
   drawCentroidGuidewire(loc, polygonRotating);

   drawTrackingDial(polygonRotating);
   drawDegreeOuterDial(polygonRotating);
   context.fillStyle = 'rgba(100, 140, 230, 0.1)';
   context.fill();

   context.beginPath();
   drawDegreeOuterDial(polygonRotating);
   context.stroke();

   drawDegreeDialTicks(polygonRotating);
   drawDegreeTickDial(polygonRotating);
   drawDegreeAnnotations(polygonRotating);
}

function redraw() {
   context.clearRect(0, 0, canvas.width, canvas.height);
   drawGrid('lightgray', 10, 10);
   drawPolygons();
}

// Polygons......................................................

function drawPolygon(polygon, angle) {
   var tx = polygon.x,
       ty = polygon.y;

   context.save();

   // 移动中心点
   context.translate(tx, ty);

   // 有角度就旋转
   if (angle) {
      context.rotate(angle);
   }

   polygon.x = 0;
   polygon.y = 0;
   
   polygon.createPath(context);
   context.stroke();

   if (fillCheckbox.checked) {
      context.fill();
   }

   context.restore();

   // 恢复坐标
   polygon.x = tx;
   polygon.y = ty;
}

function getSelectedPolygon(loc) {
   for (var i=0; i < polygons.length; ++i) {
      var polygon = polygons[i];

      polygon.createPath(context);
      if (context.isPointInPath(loc.x, loc.y)) {
         startDragging(loc);
         draggingOffsetX = loc.x - polygon.x;
         draggingOffsetY = loc.y - polygon.y;
         return polygon;
      }
   }
   return undefined;
}

function stopRotatingPolygon(loc) {
   angle = Math.atan((loc.y - polygonRotating.y) /
                     (loc.x - polygonRotating.x))
                     - rotatingLockAngle;

   polygonRotating.startAngle += angle;

   polygonRotating = undefined;
   rotatingLockEngaged = false;
   rotatingLockAngle = 0;
}

function startDragging(loc) {
  saveDrawingSurface();
  mousedown.x = loc.x;
  mousedown.y = loc.y;
}

// Event handlers................................................

canvas.onmousedown = function (e) {
   var loc = windowToCanvas(e),
       angle,
       radius,
       trackingRadius;

   e.preventDefault(); // prevent cursor change

   if (editing) {
      if (polygonRotating) {
         stopRotatingPolygon(loc);
         redraw();
      }

      polygonRotating = getSelectedPolygon(loc);

      if (polygonRotating) {
         drawRotationAnnotations(loc);

         if (!rotatingLockEngaged) {
            rotatingLockEngaged = true;
            rotatingLockAngle = Math.atan((loc.y - polygonRotating.y) /
                                          (loc.x - polygonRotating.x));
         }
      }
   }
   else {
      startDragging(loc);
      dragging = true;
   }
};

canvas.onmousemove = function (e) {
   var loc = windowToCanvas(e),
       radius = Math.sqrt(Math.pow(loc.x - dragging.x, 2) +
                          Math.pow(loc.y - dragging.y, 2)),
       angle;


   e.preventDefault(); // prevent selections

   if (rotatingLockEngaged) {
      angle = Math.atan((loc.y - polygonRotating.y) /
                        (loc.x - polygonRotating.x))
                        - rotatingLockAngle;

      redraw();

      drawPolygon(polygonRotating, angle);
      drawRotationAnnotations(loc);
   }
   else if (dragging) {
      restoreDrawingSurface();
      updateRubberband(loc, sides, startAngle);

      if (guidewires) {
         drawGuidewires(mousedown.x, mousedown.y);
      }
   }
};

canvas.onmouseup = function (e) {
   var loc = windowToCanvas(e);

   dragging = false;

   if (!editing) {
      restoreDrawingSurface();
      updateRubberband(loc);
   }
};

eraseAllButton.onclick = function (e) {
   context.clearRect(0, 0, canvas.width, canvas.height);
   drawGrid('lightgray', 10, 10);
   saveDrawingSurface(); 
};

strokeStyleSelect.onchange = function (e) {
   context.strokeStyle = strokeStyleSelect.value;
};

fillStyleSelect.onchange = function (e) {
   context.fillStyle = fillStyleSelect.value;
};

function startEditing() {
   canvas.style.cursor = 'pointer';
   editing = true;
}

function stopEditing() {
   canvas.style.cursor = 'crosshair';
   editing = false;
   polygonRotating = undefined;
   rotatingLockEngaged = false;
   rotatingLockAngle = 0;
   context.clearRect(0, 0, canvas.width, canvas.height);
   drawGrid('lightgray', 10, 10);
   drawPolygons();
}

editCheckbox.onchange = function (e) {
   if (editCheckbox.checked) {
      startEditing();
   }
   else {
      stopEditing();
   }  
};

// Initialization................................................

context.strokeStyle = strokeStyleSelect.value;
context.fillStyle = fillStyleSelect.value;

drawGrid('lightgray', 10, 10);

if (navigator.userAgent.indexOf('Opera') === -1)
   context.shadowColor = 'rgba(0, 0, 0, 0.4)';

context.shadowOffsetX = 2;
context.shadowOffsetY = 2;
context.shadowBlur = 4;

context.textAlign = 'center';
context.textBaseline = 'middle';

