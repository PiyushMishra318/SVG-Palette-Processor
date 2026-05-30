'use strict';

const { JSDOM } = require('jsdom');
const Color = require('color');
const fs = require('fs');

const SOLID_COLOR_TAGS = [
  'g', 'altGlyph', 'circle', 'ellipse', 'path', 'polygon', 'polyline', 'rect',
  'text', 'textPath', 'tspan', 'animate', 'animateMotion', 'animateTransform',
  'set', 'tref',
];

const GRADIENT_TAGS = ['linearGradient', 'radialGradient'];
const SVG_NS = 'http://www.w3.org/2000/svg';

function convertToRGBA(value) {
  const rgba = Color(value).rgb().object();
  rgba.a = rgba.a ?? 1;
  return rgba;
}

function colorsEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function findExistingColorId(collection, color) {
  for (const [id, entry] of Object.entries(collection)) {
    if (entry.color && colorsEqual(entry.color, color)) {
      return id;
    }
  }
  return null;
}

function getColorValue(element, propertyName) {
  if (
    element.hasAttribute(propertyName) &&
    element.getAttribute(propertyName) !== 'none' &&
    element.getAttribute(propertyName) !== ''
  ) {
    return element.getAttribute(propertyName);
  }

  const styleValue = element.style?.getPropertyValue(propertyName);
  if (styleValue && styleValue !== 'none' && styleValue !== '') {
    return styleValue;
  }

  return null;
}

function createDefElement(document, color, id) {
  const linearGradient = document.createElementNS(SVG_NS, 'linearGradient');
  linearGradient.setAttribute('id', `gradient-${id}`);

  const stop = document.createElementNS(SVG_NS, 'stop');
  stop.setAttribute('id', id);
  stop.setAttribute('stop-color', color);
  stop.setAttribute('offset', '100%');
  linearGradient.appendChild(stop);
  return linearGradient;
}

function findGradientColors(document) {
  const gradients = {};
  const obsoleteGradients = {};
  let stopCounter = 0;

  for (const tag of GRADIENT_TAGS) {
    for (const gradient of document.getElementsByTagName(tag)) {
      const gradientId = gradient.getAttribute('id');
      const stops = gradient.getElementsByTagName('stop');

      if (!stops || stops.length === 0) {
        if (gradientId) obsoleteGradients[gradientId] = 'No Stops';
        continue;
      }

      const stopList = {};
      for (const stop of stops) {
        let stopColor = getColorValue(stop, 'stop-color');
        if (!stopColor || stopColor.includes('url')) {
          stopCounter += 1;
          continue;
        }

        if (stop.style?.getPropertyValue('stop-color')) {
          stop.setAttribute('stop-color', stop.style.getPropertyValue('stop-color'));
          stop.style.setProperty('stop-color', '');
          stopColor = stop.getAttribute('stop-color');
        }

        const rgba = convertToRGBA(stopColor);
        const existingId = findExistingColorId(stopList, rgba);
        const id = existingId ?? `stop${++stopCounter}`;

        stop.setAttribute('id', id);
        if (!existingId) {
          stopList[id] = { id, color: rgba };
        }
      }

      if (Object.keys(stopList).length > 0 && gradientId) {
        gradients[gradientId] = { id: gradientId, stops: stopList };
      }
    }
  }

  return { gradients, obsoleteGradients };
}

function applySolidColor(document, defs, collection, propertyName, tag, element, gradients, counter) {
  const raw = getColorValue(element, propertyName);
  if (!raw) {
    return counter;
  }

  if (raw.includes('url(')) {
    const ref = raw.substring(5, raw.length - 1);
    if (!gradients[ref]) {
      const id = `${tag}${++counter}`;
      collection[id] = { id, reference: ref };
    }
    element.setAttribute(propertyName, raw);
    element.style?.setProperty(propertyName, '');
    return counter;
  }

  const rgba = convertToRGBA(raw);
  const existingId = findExistingColorId(collection, rgba);
  const id = existingId ?? `${tag}${++counter}`;

  if (!existingId) {
    defs.appendChild(createDefElement(document, raw, id));
    collection[id] = {
      id,
      reference: `url(#gradient-${id})`,
      color: rgba,
    };
  }

  element.setAttribute(propertyName, `url(#gradient-${existingId ?? id})`);
  element.style?.setProperty(propertyName, '');
  return counter;
}

function findSolidColors(document, defs, gradients) {
  const fills = {};
  const strokes = {};
  let counter = 0;

  for (const tag of SOLID_COLOR_TAGS) {
    for (const element of document.getElementsByTagName(tag)) {
      counter = applySolidColor(document, defs, fills, 'fill', tag, element, gradients, counter);
      counter = applySolidColor(document, defs, strokes, 'stroke', tag, element, gradients, counter);
    }
  }

  return { fills, strokes };
}

function processSvg(svgContent) {
  const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
  const document = dom.window.document;
  const svgElement = document.getElementsByTagName('svg')[0];

  if (!svgElement) {
    throw new Error('No <svg> element found in input');
  }

  let defs = document.getElementById('generated_def');
  if (!defs) {
    defs = document.createElementNS(SVG_NS, 'defs');
    defs.setAttribute('id', 'generated_def');
    svgElement.appendChild(defs);
  }

  const { gradients, obsoleteGradients } = findGradientColors(document);
  const allGradients = { ...gradients, ...obsoleteGradients };
  const { fills, strokes } = findSolidColors(document, defs, allGradients);

  svgElement.removeAttribute('width');
  svgElement.removeAttribute('height');

  return {
    svg: svgElement.outerHTML,
    palette: {
      fills,
      strokes,
      gradients,
      obsoleteGradients,
    },
  };
}

function processSvgFile(inputPath) {
  const svgContent = fs.readFileSync(inputPath, 'utf8');
  return processSvg(svgContent);
}

module.exports = {
  processSvg,
  processSvgFile,
  convertToRGBA,
};
