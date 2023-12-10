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

var canvas = document.getElementById("canvas"),
  context = canvas.getContext("2d"),
  FONT_HEIGHT = 15,
  MARGIN = 35,
  HAND_TRUNCATION = canvas.width / 25,
  HOUR_HAND_TRUNCATION = canvas.width / 10,
  NUMERAL_SPACING = 20,
  RADIUS = canvas.width / 2 - MARGIN,
  HAND_RADIUS = RADIUS + NUMERAL_SPACING;

// Functions.....................................................

function drawCircle() {
  context.beginPath();
  context.arc(
    canvas.width / 2,
    canvas.height / 2,
    RADIUS,
    0,
    Math.PI * 2,
    true
  );
  context.stroke();
}

function drawCenter() {
  context.beginPath();
  context.arc(canvas.width / 2, canvas.height / 2, 5, 0, Math.PI * 2, true);
  context.fill();
}

const numeralsWidth = new Array(12).fill(0);

// context.measureText 是一个比较消耗性能的方法，频繁调用不好，所以缓存起来
// 其实设置为等宽字体后这个也可以忽略，都是常量
function getWidth(num) {
  let width = numeralsWidth[num - 1];
  if (width) {
    return width;
  }

  width = context.measureText(num).width;
  numeralsWidth[num - 1] = width;

  return width;
}

function drawNumerals() {
  for (let index = 0; index < 12; index++) {
    const number = index + 1;
    const angle = (Math.PI / 6) * number;
    const width = getWidth(number);

    // 注意 y 坐标是从上到下的，和中学的坐标系不一样
    context.fillText(
      number,
      canvas.width / 2 + Math.sin(angle) * HAND_RADIUS - width / 2,
      canvas.height / 2 - Math.cos(angle) * HAND_RADIUS + FONT_HEIGHT / 2
    );
  }
}

/**
 * 
 * @param {*} loc 时间，0-59
 * @param {*} isHour 用来控制 时针 的长度
 */
function drawHand(loc, isHour) {
  const angle = Math.PI * 2 * (loc / 60); // 计算角度
  const handRadius = isHour
      ? RADIUS - HAND_TRUNCATION - HOUR_HAND_TRUNCATION
      : RADIUS - HAND_TRUNCATION;

  context.moveTo(canvas.width / 2, canvas.height / 2);
  context.lineTo(
    canvas.width / 2 + Math.sin(angle) * handRadius,
    canvas.height / 2 - Math.cos(angle) * handRadius
  );

  context.stroke();
}

function drawHands() {
  var date = new Date(),
    hour = date.getHours();
  hour = hour > 12 ? hour - 12 : hour;
  drawHand(hour * 5 + (date.getMinutes() / 60) * 5, true);
  drawHand(date.getMinutes() /** 0-59 */, false);
  drawHand(date.getSeconds() /** 0-59 */, false);
}

function drawClock() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  drawCircle();
  drawCenter();
  drawNumerals();
  drawHands();
}

// Initialization................................................

context.font = FONT_HEIGHT + "px monospace";
loop = setInterval(drawClock, 1000);
